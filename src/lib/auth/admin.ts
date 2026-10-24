import "server-only";
import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security/events";
import { requestContext } from "@/lib/security/request";

export type AdminRole = "admin" | "editor";

export type AdminSession = {
  userId: string;
  email: string;
  roles: AdminRole[];
  aal: "aal1" | "aal2";
};

/**
 * Reads the current Supabase session and validates it against the Auth server (getUser, not
 * getSession). Cached per request.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: aal }, { data: roles }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    // RLS lets a user read their own role rows only.
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  return {
    userId: user.id,
    email: user.email ?? "",
    roles: ((roles ?? []) as { role: AdminRole }[]).map((r) => r.role),
    aal: aal?.currentLevel === "aal2" ? "aal2" : "aal1",
  };
});

/**
 * Gate for every admin page, server action and route handler. Never rely on the proxy alone.
 * - no session → login; session without MFA → MFA step; no role → 403 (and a security event).
 * The database enforces the same rule again through RLS (role + allowlist + aal2).
 */
export async function requireAdmin(role: AdminRole = "editor"): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.aal !== "aal2") redirect("/admin/mfa");
  const allowed = role === "editor" ? session.roles.length > 0 : session.roles.includes("admin");
  if (!allowed) {
    const ctx = await requestContext();
    await logSecurityEvent({
      type: "access_denied",
      severity: "medium",
      userId: session.userId,
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      endpoint: `admin:${role}`,
    });
    forbidden();
  }
  return session;
}
