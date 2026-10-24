import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { RESIDUAL_RISKS, scoreOf, securityChecks } from "@/lib/security/score";
import { liftBlock, toggleRule, updateIncident } from "../actions";

export const metadata = { title: "Sécurité" };

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium", timeZone: "Africa/Ndjamena" }).format(new Date(iso));

const SEV_CLASS: Record<string, string> = {
  info: "bg-paper text-navy",
  low: "bg-[#EEF4FB] text-blue",
  medium: "bg-[#fffaf0] text-gold-ink",
  high: "bg-[#FEF3F2] text-destructive",
  critical: "bg-destructive text-white",
};

function Sev({ s }: { s: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${SEV_CLASS[s] ?? ""}`}>{s}</span>;
}

export default async function SecurityPage() {
  await requireAdmin("admin");
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [{ data: incidents }, { data: events }, { data: blocks }, { data: rules }, { data: memory }] = await Promise.all([
    supabase
      .from("incidents")
      .select("id, created_at, status, severity, title, asset, vector, confidence, attribution_uncertain, timeline, evidence, root_cause, impact, remediation_proposed, remediation_applied, validated_by")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("security_events")
      .select("id, created_at, event_type, severity, endpoint, payload_summary")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("blocked_entities")
      .select("id, entity_type, value, reason, expires_at, created_by, created_at")
      .is("lifted_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false }),
    supabase.from("detection_rules").select("id, name, event_type, threshold, window_seconds, severity, block_minutes, enabled, proposed_by").order("name"),
    supabase.from("security_memory").select("id, pattern_name, attack_type, cause, fix, occurrences, first_seen").order("first_seen", { ascending: false }).limit(20),
  ]);

  const checks = securityChecks(process.env);
  const score = scoreOf(checks);
  const open = (incidents ?? []).filter((i) => i.status !== "clos");
  const bySeverity = ["critical", "high", "medium", "low", "info"].map((s) => [s, open.filter((i) => i.severity === s).length] as const);

  return (
    <>
      <h1 className="h1 text-navy">Sécurité</h1>
      <p className="mt-2 max-w-3xl text-slate">
        Réponse défensive uniquement : blocages temporaires et réversibles, aucune action sur des systèmes tiers. Les
        corrections sont proposées puis appliquées après validation humaine.
      </p>

      <section aria-labelledby="score-title" className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 id="score-title" className="text-sm font-bold text-slate uppercase">
            Score indicatif
          </h2>
          <p className="font-heading text-6xl font-extrabold text-navy">{score}</p>
          <p className="text-sm text-slate">sur 100 · indicateur, pas une certification</p>
        </div>
        <ul className="space-y-2 rounded-lg border border-border bg-white p-4 text-sm">
          {checks.map((c) => (
            <li key={c.id} className="grid gap-1 sm:grid-cols-[1.5rem_1fr_9rem]">
              <span aria-hidden="true" className={c.ok ? "text-[#1F7A4D]" : "text-destructive"}>
                {c.ok ? "✓" : "✗"}
              </span>
              <span>
                <span className="font-semibold">{c.label}</span>
                <span className="sr-only">{c.ok ? " : conforme" : " : non conforme"}</span>
                <span className="block text-slate">{c.evidence}</span>
              </span>
              <span className="text-slate">Certitude : {c.certainty}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="risks-title" className="mt-10">
        <h2 id="risks-title" className="h2 text-navy">
          Risques résiduels
        </h2>
        <ul className="mt-3 list-disc space-y-1 ps-5">
          {RESIDUAL_RISKS.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="incidents-title" className="mt-10">
        <h2 id="incidents-title" className="h2 text-navy">
          Incidents
        </h2>
        <p className="mt-2 flex flex-wrap gap-3 text-sm">
          {bySeverity.map(([s, n]) => (
            <span key={s}>
              <Sev s={s} /> {n} ouvert(s)
            </span>
          ))}
        </p>
        <ul className="mt-4 space-y-3">
          {(incidents ?? []).map((i) => (
            <li key={i.id}>
              <details className="rounded-lg border border-border bg-white p-4">
                <summary className="cursor-pointer">
                  <Sev s={i.severity} /> <span className="font-semibold">{i.title}</span> · {fmt(i.created_at)} · {i.status}
                </summary>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]">
                  <dt className="font-semibold">Actif</dt>
                  <dd>{i.asset ?? "—"}</dd>
                  <dt className="font-semibold">Vecteur</dt>
                  <dd>{i.vector ?? "—"}</dd>
                  <dt className="font-semibold">Confiance</dt>
                  <dd>
                    {i.confidence}
                    {i.attribution_uncertain && " · attribution de la source incertaine"}
                  </dd>
                  <dt className="font-semibold">Correction proposée</dt>
                  <dd className="whitespace-pre-wrap">{i.remediation_proposed ?? "—"}</dd>
                  <dt className="font-semibold">Chronologie</dt>
                  <dd>
                    <pre className="overflow-x-auto text-xs whitespace-pre-wrap">{JSON.stringify(i.timeline, null, 2)}</pre>
                  </dd>
                </dl>
                <form action={updateIncident} className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-2">
                  <input type="hidden" name="id" value={i.id} />
                  <label className="text-sm font-semibold">
                    Statut
                    <select name="status" defaultValue={i.status} className="field mt-1">
                      {["ouvert", "contenu", "en_analyse", "corrige", "clos"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Impact
                    <input name="impact" defaultValue={i.impact ?? ""} className="field mt-1" maxLength={4000} />
                  </label>
                  <label className="text-sm font-semibold md:col-span-2">
                    Cause
                    <textarea name="root_cause" defaultValue={i.root_cause ?? ""} rows={2} className="field mt-1" maxLength={4000} />
                  </label>
                  <label className="text-sm font-semibold md:col-span-2">
                    Correction appliquée
                    <textarea name="remediation_applied" defaultValue={i.remediation_applied ?? ""} rows={2} className="field mt-1" maxLength={8000} />
                  </label>
                  <label className="flex items-center gap-3 text-sm md:col-span-2">
                    <input type="checkbox" name="validate" className="size-5 accent-blue" defaultChecked={Boolean(i.validated_by)} />
                    Je valide la correction (validation humaine requise avant clôture)
                  </label>
                  <div className="flex flex-wrap gap-3 md:col-span-2">
                    <button type="submit" className="btn btn-primary">
                      Enregistrer
                    </button>
                    <Link href={`/admin/securite/export/${i.id}`} className="btn btn-secondary" prefetch={false}>
                      Exporter (JSON)
                    </Link>
                  </div>
                </form>
              </details>
            </li>
          ))}
        </ul>
        {(incidents ?? []).length === 0 && <p className="mt-3 text-slate">Aucun incident enregistré.</p>}
      </section>

      <section aria-labelledby="blocks-title" className="mt-10">
        <h2 id="blocks-title" className="h2 text-navy">
          Blocages actifs
        </h2>
        <ul className="mt-3 space-y-2">
          {(blocks ?? []).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-white p-3 text-sm">
              <span>
                {b.entity_type} <code>{b.value.slice(0, 12)}…</code> · {b.reason} · expire {fmt(b.expires_at)}
              </span>
              <form action={liftBlock}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="btn btn-secondary">
                  Lever le blocage
                </button>
              </form>
            </li>
          ))}
        </ul>
        {(blocks ?? []).length === 0 && <p className="mt-3 text-slate">Aucun blocage actif.</p>}
      </section>

      <section aria-labelledby="events-title" className="mt-10">
        <h2 id="events-title" className="h2 text-navy">
          Derniers événements
        </h2>
        <p className="text-sm text-slate">Actualisez la page pour voir les nouveaux événements.</p>
        <table className="mt-3 w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="border-b-2 border-navy">
              <th scope="col" className="p-2">Date</th>
              <th scope="col" className="p-2">Type</th>
              <th scope="col" className="p-2">Gravité</th>
              <th scope="col" className="p-2">Point d&apos;entrée</th>
              <th scope="col" className="p-2">Résumé</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e) => (
              <tr key={e.id} className="border-b border-border">
                <td className="p-2 whitespace-nowrap">{fmt(e.created_at)}</td>
                <td className="p-2">{e.event_type}</td>
                <td className="p-2">
                  <Sev s={e.severity} />
                </td>
                <td className="p-2">{e.endpoint ?? "—"}</td>
                <td className="p-2">
                  <code className="text-xs">{JSON.stringify(e.payload_summary)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="rules-title" className="mt-10">
        <h2 id="rules-title" className="h2 text-navy">
          Règles de détection
        </h2>
        <table className="mt-3 w-full border-collapse bg-white text-left text-sm">
          <thead>
            <tr className="border-b-2 border-navy">
              <th scope="col" className="p-2">Règle</th>
              <th scope="col" className="p-2">Seuil</th>
              <th scope="col" className="p-2">Gravité</th>
              <th scope="col" className="p-2">Blocage</th>
              <th scope="col" className="p-2">État</th>
            </tr>
          </thead>
          <tbody>
            {(rules ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="p-2">
                  {r.name}
                  {r.proposed_by === "system" && <span className="ms-2 text-xs text-gold-ink">proposée</span>}
                </td>
                <td className="p-2">
                  {r.threshold} {r.event_type} / {Math.round(r.window_seconds / 60)} min
                </td>
                <td className="p-2">
                  <Sev s={r.severity} />
                </td>
                <td className="p-2">{r.block_minutes ? `${r.block_minutes} min` : "—"}</td>
                <td className="p-2">
                  <form action={toggleRule}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="enabled" value={String(!r.enabled)} />
                    <button type="submit" className="link">
                      {r.enabled ? "Active (désactiver)" : "Inactive (activer)"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="memory-title" className="mt-10">
        <h2 id="memory-title" className="h2 text-navy">
          Mémoire de sécurité
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(memory ?? []).map((m) => (
            <li key={m.id} className="rounded-md border border-border bg-white p-3">
              <span className="font-semibold">{m.pattern_name}</span> · {m.attack_type} · {m.occurrences} occurrence(s)
              {m.fix && <span className="block text-slate">Correction : {m.fix}</span>}
            </li>
          ))}
        </ul>
        {(memory ?? []).length === 0 && <p className="mt-3 text-slate">Alimentée automatiquement à la clôture des incidents.</p>}
      </section>
    </>
  );
}
