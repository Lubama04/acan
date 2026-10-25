import { z } from "zod";
import {
  BUDGET_OPTIONS,
  CONTACT_TOPICS,
  LOCATION_OPTIONS,
  SEGMENT_OPTIONS,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/lib/site";

const values = <T extends readonly { value: string }[]>(opts: T) =>
  opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const text = (min: number, max: number, minMsg: string) =>
  z
    .string()
    .trim()
    .min(min, minMsg)
    .max(max, `${max} caractères maximum`)
    // Control characters are never legitimate in these fields.
    .refine((v) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v), "Caractères non autorisés");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum`)
    .optional()
    .transform((v) => (v ? v : undefined));

export const email = z.string().trim().toLowerCase().max(254).email("Adresse e-mail invalide");

const phone = z
  .string()
  .trim()
  .max(20)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^\+?[0-9 ()-]{6,20}$/.test(v), "Numéro de téléphone invalide");

const consent = z.literal(true, { error: "Votre accord est nécessaire pour traiter la demande" });

/** Quote request (multi-step form). Unknown keys are rejected (strict). */
export const quoteSchema = z
  .object({
    segment: z.enum(values(SEGMENT_OPTIONS), { error: "Choisissez un type d'organisation" }),
    organization: optionalText(160),
    services: z
      .array(z.enum(values(SERVICE_OPTIONS)))
      .min(1, "Choisissez au moins un service")
      .max(6),
    package_slug: optionalText(80),
    message: text(20, 4000, "Décrivez votre besoin en quelques phrases (20 caractères minimum)"),
    budget_range: z.enum(values(BUDGET_OPTIONS)).default("non-defini"),
    timeline: z.enum(values(TIMELINE_OPTIONS)).default("non-defini"),
    location: z.enum(values(LOCATION_OPTIONS)).default("ndjamena"),
    full_name: text(2, 120, "Indiquez votre nom"),
    email,
    phone,
    consent,
  })
  .strict();
export type QuoteInput = z.input<typeof quoteSchema>;

export const contactSchema = z
  .object({
    full_name: text(2, 120, "Indiquez votre nom"),
    email,
    phone,
    topic: z.enum(values(CONTACT_TOPICS), { error: "Choisissez un sujet" }),
    message: text(10, 4000, "Votre message est trop court"),
    consent,
  })
  .strict();

export const newsletterSchema = z.object({ email, consent }).strict();

/** Honeypot + minimum fill time. Bots fill hidden fields and submit instantly. */
export const antiSpamSchema = z.object({
  website: z.string().max(0).optional().or(z.literal("")),
  started_at: z.coerce.number().int().positive(),
  // Server-issued token binding started_at to the render time (see lib/security/tokens.ts).
  started_sig: z.string().max(80),
});
export const MIN_FILL_MS = 3000;

/** Field-level errors in a shape the forms can render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
