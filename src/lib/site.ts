// Static site configuration. Editable business data lives in Supabase (site_settings).

// Production sets NEXT_PUBLIC_SITE_URL (real domain). Previews fall back to the deployment URL that
// Vercel provides, so canonical and share URLs never point to localhost.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

export const LOCALES = {
  fr: { label: "Français", dir: "ltr", enabled: true },
  ar: { label: "العربية", dir: "rtl", enabled: false },
  en: { label: "English", dir: "ltr", enabled: false },
} as const;
export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "fr";

export type NavItem = { href: string; label: string; flag?: "feature_case_studies" };

export const MAIN_NAV: NavItem[] = [
  { href: "/agence", label: "L'agence" },
  { href: "/services", label: "Services" },
  { href: "/secteurs", label: "Secteurs" },
  { href: "/realisations", label: "Réalisations", flag: "feature_case_studies" },
  { href: "/journal", label: "Journal" },
  { href: "/publicite", label: "Publicité" },
  { href: "/contact", label: "Contact" },
];

export const LEGAL_NAV: NavItem[] = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/cgu", label: "Conditions d'utilisation" },
  { href: "/contenus-sponsorises", label: "Contenus sponsorisés" },
];

// Routes where no advertising may ever be displayed.
export const AD_FREE_PREFIXES = [
  "/admin",
  "/devis",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
  "/cookies",
  "/cgu",
  "/contenus-sponsorises",
];

export function isAdFreePath(pathname: string) {
  return AD_FREE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const POST_CATEGORY_LABELS = {
  conseils: "Conseils",
  "etudes-de-cas": "Études de cas",
  "actualites-agence": "Actualités de l'agence",
  ressources: "Ressources",
} as const;

export const SERVICE_OPTIONS = [
  { value: "communication-institutionnelle", label: "Communication institutionnelle" },
  { value: "gestion-reseaux-sociaux", label: "Gestion des réseaux sociaux" },
  { value: "production-photo-video", label: "Production photo et vidéo" },
  { value: "redaction-contenus", label: "Rédaction de contenus" },
  { value: "relations-presse", label: "Relations presse" },
  { value: "autre", label: "Autre besoin" },
] as const;

export const SEGMENT_OPTIONS = [
  { value: "institution", label: "Institution publique ou collectivité" },
  { value: "ong", label: "ONG, agence onusienne ou projet de développement" },
  { value: "entreprise", label: "Entreprise" },
  { value: "education-sante", label: "Éducation, santé ou institution religieuse" },
  { value: "entrepreneur", label: "Entrepreneur ou startup" },
  { value: "association", label: "Association ou organisateur d'événements" },
  { value: "autre", label: "Autre" },
] as const;

export const BUDGET_OPTIONS = [
  { value: "non-defini", label: "Je ne sais pas encore" },
  { value: "moins-500k", label: "Moins de 500 000 FCFA" },
  { value: "500k-1m", label: "500 000 à 1 000 000 FCFA" },
  { value: "1m-3m", label: "1 à 3 millions FCFA" },
  { value: "plus-3m", label: "Plus de 3 millions FCFA" },
] as const;

export const TIMELINE_OPTIONS = [
  { value: "urgent", label: "Urgent (moins de 2 semaines)" },
  { value: "1-mois", label: "Dans le mois" },
  { value: "1-3-mois", label: "Dans 1 à 3 mois" },
  { value: "plus-3-mois", label: "Plus tard" },
  { value: "non-defini", label: "Pas encore défini" },
] as const;

export const LOCATION_OPTIONS = [
  { value: "ndjamena", label: "N'Djamena" },
  { value: "province", label: "Autre ville du Tchad" },
  { value: "diaspora", label: "Hors du Tchad (diaspora, partenaire)" },
  { value: "autre", label: "Autre" },
] as const;

export const CONTACT_TOPICS = [
  { value: "question", label: "Question générale" },
  { value: "partenariat", label: "Partenariat" },
  { value: "publicite", label: "Publicité sur le site" },
  { value: "presse", label: "Presse" },
  { value: "donnees-personnelles", label: "Mes données personnelles" },
  { value: "autre", label: "Autre" },
] as const;
