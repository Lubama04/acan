"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/admin";
import { logSecurityEvent } from "@/lib/security/events";
import { requestContext } from "@/lib/security/request";

export type AuthState = { error?: string; qr?: string; secret?: string; factorId?: string };

const GENERIC = "Identifiants incorrects ou compte non autorisé.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
});

/** Optional per-IP throttle for the login form (requires the service role). */
async function loginAllowed(ipHash: string) {
  const db = getServiceClient();
  if (!db) return true;
  const { data, error } = await db.rpc("consume_rate_limit", {
    p_bucket: "login",
    p_key_hash: ipHash,
    p_max: 10,
    p_window_seconds: 900,
  });
  return error ? true : data !== false;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ctx = await requestContext();
  if (!(await loginAllowed(ctx.ipHash))) {
    await logSecurityEvent({ type: "rate_limited", severity: "medium", ipHash: ctx.ipHash, userAgent: ctx.userAgent, endpoint: "/admin/login" });
    return { error: "Trop de tentatives. Réessayez dans quinze minutes." };
  }
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    await logSecurityEvent({ type: "login_failed", severity: "low", ipHash: ctx.ipHash, userAgent: ctx.userAgent, endpoint: "/admin/login", summary: { reason: "invalid_format" } });
    return { error: GENERIC };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    await logSecurityEvent({ type: "login_failed", severity: "low", ipHash: ctx.ipHash, userAgent: ctx.userAgent, endpoint: "/admin/login" });
    return { error: GENERIC };
  }
  await logSecurityEvent({ type: "login_succeeded", severity: "info", userId: data.user.id, ipHash: ctx.ipHash, userAgent: ctx.userAgent, endpoint: "/admin/login" });
  redirect("/admin/mfa");
}

/** Starts TOTP enrolment (first login) and returns the QR code to scan. */
export async function startEnrollment(): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  // Remove unfinished enrolments so a fresh QR code can be issued.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `admin-${Date.now()}` });
  if (error || !data) return { error: "Impossible de démarrer la configuration. Réessayez." };
  return { qr: data.totp.qr_code, secret: data.totp.secret, factorId: data.id };
}

const codeSchema = z.object({ factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) });

export async function verifyMfa(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ctx = await requestContext();
  const parsed = codeSchema.safeParse({ factorId: formData.get("factorId"), code: formData.get("code") });
  if (!parsed.success) return { error: "Saisissez le code à 6 chiffres de votre application.", factorId: String(formData.get("factorId") ?? "") };
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify(parsed.data);
  if (error) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logSecurityEvent({ type: "mfa_failed", severity: "low", userId: user?.id, ipHash: ctx.ipHash, userAgent: ctx.userAgent, endpoint: "/admin/mfa" });
    return { error: "Code incorrect ou expiré.", factorId: parsed.data.factorId };
  }
  redirect("/admin");
}

/** Global sign-out: revokes every refresh token of the account, not just this browser. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}
