import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminSupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

/** Supabase client bound to the visitor's session (RLS applies). */
export async function createClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Privileged client (bypasses RLS). Server-only; use sparingly and never with user-supplied filters unchecked. */
export function createAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createAdminSupabaseClient(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
