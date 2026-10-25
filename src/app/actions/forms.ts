"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { requestContext } from "@/lib/security/request";
import { detectSuspiciousPayload } from "@/lib/security/patterns";
import { logSecurityEvent } from "@/lib/security/events";
import {
  antiSpamSchema,
  contactSchema,
  fieldErrors,
  MIN_FILL_MS,
  newsletterSchema,
  quoteSchema,
} from "@/lib/validation/forms";
import { getSettings } from "@/lib/settings";
import { formInsertProof, verifyFormToken } from "@/lib/security/tokens";

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fields?: Record<string, string> };

const GENERIC_ERROR =
  "Votre demande n'a pas pu être enregistrée. Réessayez dans quelques minutes ou écrivez-nous sur WhatsApp.";
const RATE_LIMITED = "Trop de demandes envoyées depuis votre connexion. Merci de réessayer un peu plus tard.";

type Kind = "quote" | "contact" | "newsletter";

/**
 * Shared guard for public forms. Next.js server actions already reject cross-origin POSTs
 * (Origin vs Host check = CSRF protection). Here: honeypot, fill time, injection heuristics.
 * Returns the request context, or a FormState to return immediately.
 */
async function guard(kind: Kind, formData: FormData, texts: unknown[]) {
  const ctx = await requestContext();
  const spam = antiSpamSchema.safeParse({
    website: formData.get("website") ?? "",
    started_at: formData.get("started_at"),
    started_sig: formData.get("started_sig") ?? "",
  });
  const forged = spam.success && !verifyFormToken(spam.data.started_at, spam.data.started_sig);
  const tooFast = spam.success && Date.now() - spam.data.started_at < MIN_FILL_MS;
  if (!spam.success || forged || tooFast) {
    await logSecurityEvent({
      type: "honeypot_triggered",
      severity: "low",
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      endpoint: `form:${kind}`,
      summary: { reason: !spam.success ? "honeypot" : forged ? "forged_or_expired_token" : "too_fast" },
    });
    // Pretend success: do not teach bots what triggered the filter.
    return { early: { status: "success", message: "Merci, votre message a bien été envoyé." } as FormState };
  }

  const patterns = detectSuspiciousPayload(texts);
  if (patterns.length) {
    await logSecurityEvent({
      type: "suspicious_payload",
      severity: "high",
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      endpoint: `form:${kind}`,
      summary: { patterns },
    });
    return {
      early: {
        status: "error",
        message:
          "Votre message contient des caractères ou du code non acceptés. Reformulez-le en texte simple.",
      } as FormState,
    };
  }
  return { ctx };
}

async function insert(
  kind: Kind,
  table: string,
  row: Record<string, unknown>,
  ipHash: string,
  userAgent: string,
) {
  // Server proof checked by the database (direct Data API inserts without it are refused).
  const proof = formInsertProof();
  if (!proof) {
    console.error("[forms] FORM_SIGNING_SECRET missing: public inserts are disabled");
    return GENERIC_ERROR;
  }
  const { error } = await createPublicClient()
    .from(table)
    .insert({ ...row, ip_hash: ipHash, ...proof });
  if (!error) return null;
  if (error.message?.includes("rate_limited")) {
    await logSecurityEvent({
      type: "rate_limited",
      severity: "low",
      ipHash,
      userAgent,
      endpoint: `form:${kind}`,
    });
    return RATE_LIMITED;
  }
  if (error.code === "23505") return "duplicate";
  console.error(`[forms] ${kind} insert failed`, error.code);
  return GENERIC_ERROR;
}

export async function submitQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    segment: formData.get("segment"),
    organization: formData.get("organization") ?? undefined,
    services: formData.getAll("services"),
    package_slug: formData.get("package_slug") ?? undefined,
    message: formData.get("message"),
    budget_range: formData.get("budget_range") ?? undefined,
    timeline: formData.get("timeline") ?? undefined,
    location: formData.get("location") ?? undefined,
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    consent: formData.get("consent") === "on",
  };
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Certains champs sont à corriger.",
      fields: fieldErrors(parsed.error),
    };
  }
  const g = await guard("quote", formData, [
    parsed.data.message,
    parsed.data.organization,
    parsed.data.full_name,
  ]);
  if (g.early) return g.early;

  const err = await insert("quote", "leads", parsed.data, g.ctx.ipHash, g.ctx.userAgent);
  if (err) return { status: "error", message: err === "duplicate" ? GENERIC_ERROR : err };
  return {
    status: "success",
    message: "Merci. Votre demande est enregistrée ; nous vous recontacterons par e-mail ou par téléphone.",
  };
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? undefined,
    topic: formData.get("topic"),
    message: formData.get("message"),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Certains champs sont à corriger.",
      fields: fieldErrors(parsed.error),
    };
  }
  const g = await guard("contact", formData, [parsed.data.message, parsed.data.full_name]);
  if (g.early) return g.early;

  const err = await insert("contact", "contact_messages", parsed.data, g.ctx.ipHash, g.ctx.userAgent);
  if (err) return { status: "error", message: err === "duplicate" ? GENERIC_ERROR : err };
  return { status: "success", message: "Merci, votre message a bien été envoyé." };
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getSettings()).feature_newsletter) {
    return { status: "error", message: "La lettre d'information n'est pas encore ouverte." };
  }
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: "Adresse invalide.", fields: fieldErrors(parsed.error) };
  }
  const g = await guard("newsletter", formData, []);
  if (g.early) return g.early;

  const err = await insert(
    "newsletter",
    "newsletter_subscribers",
    { email: parsed.data.email },
    g.ctx.ipHash,
    g.ctx.userAgent,
  );
  // A duplicate is reported as success: never reveal whether an address is already subscribed.
  if (err && err !== "duplicate") return { status: "error", message: err };
  return { status: "success", message: "Merci. Vous recevrez un e-mail de confirmation." };
}
