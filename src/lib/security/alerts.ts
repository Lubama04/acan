import "server-only";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

/**
 * Sends an incident e-mail through Resend when RESEND_API_KEY and ALERT_EMAIL_TO are configured.
 * The message never contains secrets or personal data (hashes and counts only).
 * Returns false when alerting is not configured: callers must not assume delivery.
 */
export async function sendSecurityAlert(alert: {
  severity: Severity;
  title: string;
  endpoint?: string | null;
  asset?: string | null;
  measures: string;
  recommendations: string;
  incidentId?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM ?? "Africa Média Sécurité <onboarding@resend.dev>";
  if (!apiKey || !to) return false;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const text = [
    `Sévérité : ${alert.severity.toUpperCase()}`,
    `Incident : ${alert.title}`,
    `Heure (UTC) : ${new Date().toISOString()}`,
    `Point d'entrée : ${alert.endpoint ?? "n/a"}`,
    `Actif concerné : ${alert.asset ?? "n/a"}`,
    ``,
    `Mesures déjà prises : ${alert.measures}`,
    `Actions recommandées : ${alert.recommendations}`,
    ``,
    alert.incidentId ? `Fiche : ${site}/admin/securite?incident=${alert.incidentId}` : "",
    `L'attribution de la source reste incertaine tant qu'aucune analyse humaine n'a été faite.`,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `[${alert.severity.toUpperCase()}] ${alert.title}`, text }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    console.error("[security] alert e-mail failed");
    return false;
  }
}
