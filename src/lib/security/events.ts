import "server-only";
import { getServiceClient } from "@/lib/supabase/admin";
import { sendSecurityAlert, type Severity } from "./alerts";

export type SecurityEventType =
  | "login_failed"
  | "login_succeeded"
  | "mfa_failed"
  | "access_denied"
  | "rate_limited"
  | "suspicious_payload"
  | "honeypot_triggered"
  | "role_changed"
  | "admin_action"
  | "ad_fraud_suspected"
  | "other";

export type SecurityEvent = {
  type: SecurityEventType;
  severity: Severity;
  ipHash?: string;
  userId?: string | null;
  userAgent?: string;
  endpoint?: string;
  /** Never put personal data or secrets here: field names, counts, pattern names only. */
  summary?: Record<string, string | number | boolean | string[]>;
};

const ALERT_SEVERITIES: Severity[] = ["high", "critical"];
const ALERT_GROUPING_MINUTES = 15;

/**
 * SILS phases 2–5: journal the event, apply the detection rules (qualification), contain with a
 * temporary block, open an incident and notify. Requires SUPABASE_SECRET_KEY; without it the event
 * is written to the server log only (no personal data) and nothing is blocked.
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const db = getServiceClient();
  if (!db) {
    console.warn(
      "[security-event]",
      JSON.stringify({ type: event.type, severity: event.severity, endpoint: event.endpoint }),
    );
    return;
  }

  try {
    const { error } = await db.from("security_events").insert({
      event_type: event.type,
      severity: event.severity,
      ip_hash: event.ipHash ?? null,
      user_id: event.userId ?? null,
      user_agent: event.userAgent?.slice(0, 300) ?? null,
      endpoint: event.endpoint?.slice(0, 200) ?? null,
      payload_summary: event.summary ?? {},
    });
    if (error) throw error;
    await qualify(event);
  } catch (e) {
    console.error("[security-event] write failed", (e as { code?: string }).code ?? "unknown");
  }
}

async function qualify(event: SecurityEvent) {
  const db = getServiceClient();
  if (!db || !event.ipHash) return;

  const { data: rules } = await db
    .from("detection_rules")
    .select("name, threshold, window_seconds, severity, block_minutes")
    .eq("event_type", event.type)
    .eq("enabled", true);
  if (!rules?.length) return;

  for (const rule of rules) {
    const since = new Date(Date.now() - rule.window_seconds * 1000).toISOString();
    const { count } = await db
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", event.type)
      .eq("ip_hash", event.ipHash)
      .gte("created_at", since);
    if ((count ?? 0) < rule.threshold) continue;

    // Containment: temporary, always with an expiry (never permanent without a human).
    let measures = "aucune mesure automatique";
    if (rule.block_minutes) {
      const { data: existing } = await db
        .from("blocked_entities")
        .select("id")
        .eq("entity_type", "ip")
        .eq("value", event.ipHash)
        .is("lifted_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1);
      if (!existing?.length) {
        await db.from("blocked_entities").insert({
          entity_type: "ip",
          value: event.ipHash,
          reason: `Règle ${rule.name} (${count} événements ${event.type})`,
          expires_at: new Date(Date.now() + rule.block_minutes * 60_000).toISOString(),
          created_by: `rule:${rule.name}`,
        });
      }
      measures = `blocage temporaire de l'empreinte IP pendant ${rule.block_minutes} min (levable depuis /admin/securite)`;
    }

    // Grouping: one incident per rule and source per 15 minutes.
    const groupSince = new Date(Date.now() - ALERT_GROUPING_MINUTES * 60_000).toISOString();
    const { data: recent } = await db
      .from("incidents")
      .select("id")
      .eq("title", incidentTitle(rule.name))
      .contains("evidence", [{ ip_hash: event.ipHash }])
      .gte("created_at", groupSince)
      .limit(1);
    if (recent?.length) continue;

    const { data: incident } = await db
      .from("incidents")
      .insert({
        severity: rule.severity,
        title: incidentTitle(rule.name),
        asset: event.endpoint ?? null,
        vector: event.type,
        confidence: rule.severity === "critical" ? "eleve" : "moyen",
        attribution_uncertain: true,
        timeline: [
          { at: new Date().toISOString(), what: `Seuil ${rule.threshold} atteint (${count})` },
          { at: new Date().toISOString(), what: measures },
        ],
        evidence: [
          { ip_hash: event.ipHash, event_type: event.type, count, window_seconds: rule.window_seconds },
        ],
        remediation_proposed: recommendation(event.type),
      })
      .select("id")
      .single();

    if (ALERT_SEVERITIES.includes(rule.severity as Severity)) {
      await sendSecurityAlert({
        severity: rule.severity as Severity,
        title: incidentTitle(rule.name),
        endpoint: event.endpoint,
        asset: event.endpoint,
        measures,
        recommendations: recommendation(event.type),
        incidentId: incident?.id,
      });
    }
  }
}

function incidentTitle(rule: string) {
  return `Règle de détection déclenchée : ${rule}`;
}

function recommendation(type: SecurityEventType) {
  switch (type) {
    case "login_failed":
      return "Vérifier si le compte visé est légitime ; activer/contrôler la MFA ; envisager une règle Vercel Firewall sur /admin/login.";
    case "suspicious_payload":
      return "Vérifier les journaux de la route ; aucune donnée n'a été enregistrée ; maintenir la validation Zod et la CSP.";
    case "rate_limited":
      return "Surveiller le volume ; si le flux persiste, activer une règle de limitation de débit Vercel Firewall sur la route.";
    case "ad_fraud_suspected":
      return "Exclure les clics signalés de la facturation ; prévenir l'annonceur si nécessaire.";
    default:
      return "Analyser l'incident depuis /admin/securite.";
  }
}
