import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type SiteSettings = {
  legal_name: string;
  brand_name: string;
  legal_form: string | null;
  registration_status: string;
  rccm: string | null;
  nif: string | null;
  share_capital: string | null;
  address: string | null;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
  publication_director: string | null;
  privacy_contact_email: string | null;
  security_contact_email: string | null;
  hosting_provider: string | null;
  database_provider: string | null;
  social_links: Partial<Record<"facebook" | "linkedin" | "tiktok" | "instagram", string>>;
  feature_team: boolean;
  feature_case_studies: boolean;
  feature_newsletter: boolean;
  feature_media_kit: boolean;
  adsense_enabled: boolean;
};

// Safe defaults: if the database is unreachable the site still renders, conservatively.
export const DEFAULT_SETTINGS: SiteSettings = {
  legal_name: "Agence de Communication Africa Média",
  brand_name: "Africa Média",
  legal_form: "SARL",
  registration_status: "en cours d'immatriculation",
  rccm: null,
  nif: null,
  share_capital: null,
  address: null,
  city: "N'Djamena",
  country: "Tchad",
  phone: null,
  email: null,
  publication_director: null,
  privacy_contact_email: null,
  security_contact_email: null,
  hosting_provider: null,
  database_provider: null,
  social_links: {},
  feature_team: false,
  feature_case_studies: false,
  feature_newsletter: false,
  feature_media_kit: false,
  adsense_enabled: false,
};

export function mergeSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    if (!(key in DEFAULT_SETTINGS)) continue;
    const fallback = (DEFAULT_SETTINGS as Record<string, unknown>)[key];
    if (typeof fallback === "boolean") merged[key] = value === true;
    else if (value === null || value === "") merged[key] = typeof fallback === "string" ? fallback : null;
    else if (typeof fallback === "object" && fallback !== null)
      merged[key] = typeof value === "object" ? value : {};
    else merged[key] = String(value);
  }
  return merged as SiteSettings;
}

const loadSettings = unstable_cache(
  async () => {
    const { data, error } = await createPublicClient().from("site_settings").select("key, value");
    if (error) {
      console.error("[settings] load failed", error.code);
      return DEFAULT_SETTINGS;
    }
    return mergeSettings(data ?? []);
  },
  ["site-settings"],
  { revalidate: 300, tags: ["settings"] },
);

export const getSettings = cache(loadSettings);

/**
 * Legal form as it may be displayed: until RCCM and NIF exist, the company is not constituted yet,
 * so "SARL" alone would be misleading.
 */
export function legalFormLabel(s: Pick<SiteSettings, "legal_form" | "rccm" | "nif">) {
  if (!s.legal_form) return null;
  return isRegistered(s) ? s.legal_form : `${s.legal_form} en cours d'immatriculation`;
}

/** True when both legal identifiers are known; otherwise the site must say « en cours d'immatriculation ». */
export function isRegistered(s: Pick<SiteSettings, "rccm" | "nif">) {
  return Boolean(s.rccm && s.nif);
}
