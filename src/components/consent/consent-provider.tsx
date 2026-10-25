"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CONSENT_COOKIE,
  CONSENT_EVENT,
  CONSENT_MAX_AGE,
  CONSENT_OPEN_EVENT,
  consentModeSignals,
  NO_CONSENT,
  parseConsent,
  serializeConsent,
  type Consent,
} from "@/lib/consent";

type Ctx = { consent: Consent | null; save: (c: Consent) => void };
const ConsentContext = createContext<Ctx>({ consent: null, save: () => {} });
export const useConsent = () => useContext(ConsentContext);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function readCookie(): Consent | null {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];
  return parseConsent(raw ? decodeURIComponent(raw) : null);
}

/**
 * Consent banner + context. Shown only when advertising can actually run (AdSense configured);
 * otherwise the site sets no optional cookie and there is nothing to consent to.
 */
export function ConsentProvider({ children, adsAvailable }: { children: ReactNode; adsAvailable: boolean }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    const stored = readCookie();
    // Deferred to avoid a synchronous setState cascade during hydration.
    queueMicrotask(() => {
      setConsent(stored);
      setPersonalized(stored?.personalized ?? false);
      if (adsAvailable && !stored) setOpen(true);
    });
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, [adsAvailable]);

  const save = useCallback((c: Consent) => {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsent(c))}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    window.gtag?.("consent", "update", consentModeSignals(c));
    setConsent(c);
    setOpen(false);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
  }, []);

  return (
    <ConsentContext.Provider value={{ consent, save }}>
      {children}
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="consent-title"
          className="border-gold fixed inset-x-0 bottom-0 z-50 border-t-4 bg-white shadow-[0_-4px_24px_rgb(4_35_77/0.15)]"
        >
          <div className="container-site py-5">
            <h2 id="consent-title" className="h3">
              Cookies et publicité
            </h2>
            <p className="text-slate mt-2 max-w-3xl">
              Le site fonctionne sans cookie publicitaire. Si vous l&apos;acceptez, des annonces Google
              peuvent être affichées sur certaines pages du Journal ; elles sont non personnalisées sauf choix
              contraire de votre part. Vous pouvez changer d&apos;avis à tout moment depuis le pied de page.{" "}
              <Link href="/cookies" className="link">
                En savoir plus
              </Link>
            </p>
            <label className="mt-3 flex items-start gap-3">
              <input
                type="checkbox"
                className="accent-blue mt-1 size-5"
                checked={personalized}
                onChange={(e) => setPersonalized(e.target.checked)}
              />
              <span>Autoriser aussi les annonces personnalisées (basées sur votre navigation)</span>
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => save(NO_CONSENT)}>
                Refuser la publicité
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => save({ ads: true, personalized })}
              >
                Accepter la publicité
              </button>
            </div>
          </div>
        </section>
      )}
    </ConsentContext.Provider>
  );
}
