import { z } from "zod";

// Public variables are inlined at build time, so each one must be read explicitly.
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{8,15}$/, "International format, digits only")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: z
    .string()
    .regex(/^ca-pub-\d{10,20}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type PublicEnv = z.infer<typeof publicSchema>;

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  return publicSchema.parse(source);
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  });
}
