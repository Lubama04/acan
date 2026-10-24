import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  await requireAdmin("admin");
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const values: Record<string, unknown> = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return (
    <>
      <h1 className="h1 text-navy">Paramètres du site</h1>
      <p className="mt-2 max-w-3xl text-slate">
        Ne saisissez que des informations officielles et vérifiées. Tant que le RCCM et le NIF sont vides, le site affiche
        « en cours d&apos;immatriculation ».
      </p>
      <div className="mt-6">
        <SettingsForm values={values} />
      </div>
    </>
  );
}
