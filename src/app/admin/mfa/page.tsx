import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/admin";
import { MfaForm } from "./mfa-form";

export const metadata = { title: "Double authentification" };

export default async function MfaPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.aal === "aal2") redirect("/admin");

  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const verified = data?.totp?.find((f) => f.status === "verified");

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Logo className="h-10 w-auto" />
      <h1 className="h2 text-navy mt-8">Double authentification</h1>
      <p className="text-slate mt-2">
        {verified
          ? "Saisissez le code à 6 chiffres affiché par votre application d'authentification."
          : "Première connexion : associez une application d'authentification (Google Authenticator, Microsoft Authenticator, Aegis…)."}
      </p>
      <div className="border-border mt-8 rounded-lg border bg-white p-6">
        <MfaForm factorId={verified?.id} />
      </div>
    </main>
  );
}
