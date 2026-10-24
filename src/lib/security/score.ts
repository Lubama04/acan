// Security posture score shown on /admin/securite. Each check states what it verifies and how
// sure we are; the score is an indicator, not a certification.

export type Check = {
  id: string;
  label: string;
  ok: boolean;
  weight: number;
  evidence: string;
  certainty: "vérifié" | "déclaratif" | "non vérifiable ici";
};

export function securityChecks(env: Record<string, string | undefined>): Check[] {
  return [
    {
      id: "rls",
      label: "RLS activée sur toutes les tables, politiques testées",
      ok: true,
      weight: 25,
      evidence: "Tests supabase/tests/rls.test.sql (anonyme, utilisateur, admin sans liste blanche, sans MFA, avec MFA) + test de mutation.",
      certainty: "vérifié",
    },
    {
      id: "secrets",
      label: "Clé service uniquement côté serveur",
      ok: !Object.keys(env).some((k) => k.startsWith("NEXT_PUBLIC_") && /SECRET|SERVICE/i.test(k)),
      weight: 15,
      evidence: "Aucune variable NEXT_PUBLIC_* ne contient de secret ; scan de secrets en CI.",
      certainty: "vérifié",
    },
    {
      id: "headers",
      label: "En-têtes de sécurité et CSP à nonce",
      ok: true,
      weight: 15,
      evidence: "proxy.ts (CSP nonce + strict-dynamic, HSTS, X-Frame-Options, Permissions-Policy) ; tests unitaires csp.test.ts.",
      certainty: "vérifié",
    },
    {
      id: "auth",
      label: "Administration : MFA obligatoire, liste blanche, rôles séparés",
      ok: true,
      weight: 15,
      evidence: "private.is_admin() exige rôle + e-mail en liste blanche + aal2 ; requireAdmin() sur chaque page et action.",
      certainty: "vérifié",
    },
    {
      id: "journal",
      label: "Journal de sécurité et détection actifs",
      ok: Boolean(env.SUPABASE_SECRET_KEY),
      weight: 15,
      evidence: env.SUPABASE_SECRET_KEY
        ? "Événements écrits en base, règles de détection appliquées."
        : "SUPABASE_SECRET_KEY absente : événements uniquement dans les journaux Vercel, pas de blocage automatique.",
      certainty: "déclaratif",
    },
    {
      id: "alerts",
      label: "Alertes e-mail pour les incidents élevés et critiques",
      ok: Boolean(env.RESEND_API_KEY && env.ALERT_EMAIL_TO),
      weight: 10,
      evidence: env.RESEND_API_KEY && env.ALERT_EMAIL_TO ? "Resend configuré." : "RESEND_API_KEY ou ALERT_EMAIL_TO manquant : aucune alerte envoyée.",
      certainty: "déclaratif",
    },
    {
      id: "salt",
      label: "Empreintes IP salées",
      ok: Boolean(env.RATE_LIMIT_SALT),
      weight: 5,
      evidence: env.RATE_LIMIT_SALT ? "RATE_LIMIT_SALT défini." : "Sel de développement utilisé.",
      certainty: "déclaratif",
    },
  ];
}

export function scoreOf(checks: Check[]) {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.filter((c) => c.ok).reduce((s, c) => s + c.weight, 0);
  return Math.round((got / total) * 100);
}

export const RESIDUAL_RISKS = [
  "Pas de pare-feu applicatif en amont tant que les règles Vercel Firewall ne sont pas activées (voir docs/securite.md).",
  "Transfert de données hors CEMAC/CEEAC (Vercel États-Unis, Supabase France) : à valider par un juriste au regard de la loi 007/PR/2015.",
  "Inscriptions Supabase Auth : désactiver l'inscription publique et fixer 12 caractères minimum dans le tableau de bord Supabase.",
  "Sauvegardes : vérifier le niveau de sauvegarde inclus dans le forfait Supabase ; PITR non activé.",
  "Surveillance non continue : aucune astreinte humaine ; les alertes dépendent de la configuration e-mail.",
];
