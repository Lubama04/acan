import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { getAdminSession } from "@/lib/auth/admin";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) redirect(session.aal === "aal2" ? "/admin" : "/admin/mfa");
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Logo className="h-10 w-auto" />
      <h1 className="h2 mt-8 text-navy">Espace d&apos;administration</h1>
      <p className="mt-2 text-slate">Accès réservé. La double authentification est obligatoire.</p>
      <div className="mt-8 rounded-lg border border-border bg-white p-6">
        <LoginForm />
      </div>
    </main>
  );
}
