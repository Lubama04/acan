import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { deletePersonalRecord, updateLeadStatus, updateMessageStatus } from "../actions";

export const metadata = { title: "Demandes" };

const LEAD_STATUS = { new: "Nouvelle", in_progress: "En cours", quoted: "Devis envoyé", won: "Gagnée", lost: "Perdue", archived: "Archivée" };
const MSG_STATUS = { new: "Nouveau", answered: "Répondu", archived: "Archivé" };

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Ndjamena" }).format(new Date(iso));

function DeleteForm({ id, table }: { id: string; table: string }) {
  return (
    <form action={deletePersonalRecord} className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="table" value={table} />
      <label className="text-sm">
        Suppression définitive (droit à l&apos;effacement) : tapez SUPPRIMER
        <input name="confirm" className="field mt-1 max-w-48" autoComplete="off" />
      </label>
      <button type="submit" className="btn border border-destructive text-destructive">
        Supprimer
      </button>
    </form>
  );
}

export default async function RequestsPage() {
  await requireAdmin("admin");
  const supabase = await createClient();
  const [{ data: leads }, { data: messages }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, created_at, full_name, organization, email, phone, segment, services, package_slug, budget_range, timeline, location, message, status, admin_notes")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("contact_messages")
      .select("id, created_at, full_name, email, phone, topic, message, status")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <>
      <h1 className="h1 text-navy">Demandes</h1>
      <p className="mt-2 text-slate">Les 100 dernières demandes. Données personnelles : ne les copiez pas hors de cet espace sans nécessité.</p>

      <section aria-labelledby="leads-title" className="mt-10">
        <h2 id="leads-title" className="h2 text-navy">
          Demandes de devis ({leads?.length ?? 0})
        </h2>
        <ul className="mt-4 space-y-3">
          {(leads ?? []).map((l) => (
            <li key={l.id}>
              <details className="rounded-lg border border-border bg-white p-4">
                <summary className="cursor-pointer">
                  <span className="font-semibold">{l.full_name}</span>
                  {l.organization ? ` · ${l.organization}` : ""} · {fmt(l.created_at)} ·{" "}
                  <span className="rounded bg-paper px-2 py-0.5 text-sm">{LEAD_STATUS[l.status as keyof typeof LEAD_STATUS]}</span>
                </summary>
                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
                  <dt className="font-semibold">E-mail</dt>
                  <dd>
                    <a className="link" href={`mailto:${l.email}`}>
                      {l.email}
                    </a>
                  </dd>
                  <dt className="font-semibold">Téléphone</dt>
                  <dd>{l.phone ?? "—"}</dd>
                  <dt className="font-semibold">Segment</dt>
                  <dd>{l.segment}</dd>
                  <dt className="font-semibold">Services</dt>
                  <dd>{(l.services as string[]).join(", ")}</dd>
                  <dt className="font-semibold">Forfait</dt>
                  <dd>{l.package_slug ?? "—"}</dd>
                  <dt className="font-semibold">Budget / échéance / lieu</dt>
                  <dd>
                    {l.budget_range} · {l.timeline} · {l.location}
                  </dd>
                  <dt className="font-semibold">Message</dt>
                  {/* Rendered as text: React escapes it, no HTML is interpreted. */}
                  <dd className="whitespace-pre-wrap">{l.message}</dd>
                </dl>
                <form action={updateLeadStatus} className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
                  <input type="hidden" name="id" value={l.id} />
                  <label className="text-sm font-semibold">
                    Statut
                    <select name="status" defaultValue={l.status} className="field mt-1">
                      {Object.entries(LEAD_STATUS).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Notes internes
                    <input name="admin_notes" defaultValue={l.admin_notes ?? ""} maxLength={4000} className="field mt-1" />
                  </label>
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                </form>
                <DeleteForm id={l.id} table="leads" />
              </details>
            </li>
          ))}
        </ul>
      </section>

      <section id="messages" aria-labelledby="messages-title" className="mt-14">
        <h2 id="messages-title" className="h2 text-navy">
          Messages de contact ({messages?.length ?? 0})
        </h2>
        <ul className="mt-4 space-y-3">
          {(messages ?? []).map((m) => (
            <li key={m.id}>
              <details className="rounded-lg border border-border bg-white p-4">
                <summary className="cursor-pointer">
                  <span className="font-semibold">{m.full_name}</span> · {m.topic} · {fmt(m.created_at)} ·{" "}
                  <span className="rounded bg-paper px-2 py-0.5 text-sm">{MSG_STATUS[m.status as keyof typeof MSG_STATUS]}</span>
                </summary>
                <p className="mt-3 text-sm">
                  <a className="link" href={`mailto:${m.email}`}>
                    {m.email}
                  </a>
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
                <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
                <form action={updateMessageStatus} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={m.id} />
                  <label className="text-sm font-semibold">
                    Statut
                    <select name="status" defaultValue={m.status} className="field mt-1">
                      {Object.entries(MSG_STATUS).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                </form>
                <DeleteForm id={m.id} table="contact_messages" />
              </details>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
