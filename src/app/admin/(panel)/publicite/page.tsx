import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { toggleCampaign, updateAdSlot } from "../actions";
import { CampaignForm } from "./campaign-form";

export const metadata = { title: "Publicité" };

export default async function AdminAdsPage() {
  await requireAdmin("admin");
  const supabase = await createClient();
  const [{ data: slots }, { data: campaigns }, { data: stats }] = await Promise.all([
    supabase.from("ad_slots").select("key, label, width, height, enabled, adsense_slot_id").order("key"),
    supabase
      .from("ad_campaigns")
      .select("id, slot_key, advertiser, disclosure, image_url, target_url, starts_at, ends_at, active")
      .order("starts_at", { ascending: false }),
    supabase.from("ad_campaign_stats").select("campaign_id, impressions, clicks, flagged_events"),
  ]);
  const statFor = (id: string) => stats?.find((s) => s.campaign_id === id);
  const adsenseConfigured = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  return (
    <>
      <h1 className="h1 text-navy">Publicité</h1>
      <p className="text-slate mt-2">
        Priorité d&apos;affichage : sponsor direct actif, puis AdSense (si configuré et accepté par le
        visiteur), puis publicité maison. AdSense :{" "}
        {adsenseConfigured ? "identifiant configuré" : "identifiant non configuré (variable d'environnement)"}
        .
      </p>

      <section aria-labelledby="slots-title" className="mt-10">
        <h2 id="slots-title" className="h2 text-navy">
          Emplacements
        </h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {(slots ?? []).map((s) => (
            <li key={s.key} className="border-border rounded-lg border bg-white p-4">
              <form action={updateAdSlot} className="space-y-3">
                <input type="hidden" name="key" value={s.key} />
                <p className="font-semibold">
                  {s.label}{" "}
                  <span className="text-slate">
                    · {s.width}×{s.height}
                  </span>
                </p>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={s.enabled}
                    className="accent-blue size-5"
                  />
                  Emplacement actif
                </label>
                <label className="block text-sm font-semibold">
                  Identifiant de bloc AdSense (facultatif)
                  <input
                    name="adsense_slot_id"
                    defaultValue={s.adsense_slot_id ?? ""}
                    inputMode="numeric"
                    className="field mt-1"
                  />
                </label>
                <button type="submit" className="btn btn-secondary">
                  Enregistrer
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="campaigns-title" className="mt-12">
        <h2 id="campaigns-title" className="h2 text-navy">
          Campagnes sponsorisées
        </h2>
        <table className="mt-4 w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="border-navy border-b-2">
              <th scope="col" className="p-3">
                Annonceur
              </th>
              <th scope="col" className="p-3">
                Emplacement
              </th>
              <th scope="col" className="p-3">
                Période
              </th>
              <th scope="col" className="p-3">
                Affichages / clics (filtrés)
              </th>
              <th scope="col" className="p-3">
                État
              </th>
            </tr>
          </thead>
          <tbody>
            {(campaigns ?? []).map((c) => {
              const st = statFor(c.id);
              return (
                <tr key={c.id} className="border-border border-b align-top">
                  <td className="p-3">
                    <span className="font-semibold">{c.advertiser}</span>
                    <span className="text-slate block text-xs">{c.disclosure}</span>
                  </td>
                  <td className="p-3">{c.slot_key}</td>
                  <td className="p-3">
                    {new Date(c.starts_at).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(c.ends_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="p-3">
                    {st?.impressions ?? 0} / {st?.clicks ?? 0}
                    {(st?.flagged_events ?? 0) > 0 && (
                      <span className="text-slate block text-xs">
                        {st?.flagged_events} écartés (robots, répétitions)
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <form action={toggleCampaign}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={String(!c.active)} />
                      <button type="submit" className={`btn ${c.active ? "btn-secondary" : "btn-primary"}`}>
                        {c.active ? "Désactiver" : "Activer"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!process.env.SUPABASE_SECRET_KEY && (
          <p className="notice mt-4 text-sm">
            Le comptage des affichages et des clics nécessite la variable SUPABASE_SECRET_KEY côté serveur.
            Tant qu&apos;elle est absente, les campagnes s&apos;affichent mais ne sont pas comptées.
          </p>
        )}
        <div className="mt-8 max-w-3xl">
          <h3 className="h3 text-navy">Nouvelle campagne</h3>
          <CampaignForm />
        </div>
      </section>
    </>
  );
}
