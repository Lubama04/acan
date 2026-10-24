// Consent state shared by the banner, the AdSense loader and Google Consent Mode v2.
// Stored in a first-party cookie for 180 days; no consent = only strictly necessary cookies.

export const CONSENT_COOKIE = "am_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;
export const CONSENT_EVENT = "am:consent-change";
export const CONSENT_OPEN_EVENT = "am:consent-open";

export type Consent = {
  /** Advertising cookies (AdSense). Off by default. */
  ads: boolean;
  /** Personalised ads. Off by default; only meaningful when ads is true. */
  personalized: boolean;
};

export const NO_CONSENT: Consent = { ads: false, personalized: false };

export function serializeConsent(c: Consent): string {
  return `v1.ads-${c.ads ? 1 : 0}.pers-${c.ads && c.personalized ? 1 : 0}`;
}

export function parseConsent(raw: string | undefined | null): Consent | null {
  if (!raw) return null;
  const m = /^v1\.ads-([01])\.pers-([01])$/.exec(raw);
  if (!m) return null;
  const ads = m[1] === "1";
  return { ads, personalized: ads && m[2] === "1" };
}

/** Google Consent Mode v2 signals for a given choice. */
export function consentModeSignals(c: Consent) {
  return {
    ad_storage: c.ads ? "granted" : "denied",
    ad_user_data: c.ads ? "granted" : "denied",
    ad_personalization: c.ads && c.personalized ? "granted" : "denied",
    analytics_storage: "denied",
  } as const;
}

/** Inline script run before any Google tag: everything denied by default. */
export const CONSENT_DEFAULT_SCRIPT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});gtag('set','ads_data_redaction',true);`;
