"use client";

import { useEffect } from "react";
import { useConsent } from "@/components/consent/consent-provider";

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

/**
 * Loads the AdSense library only after explicit advertising consent.
 * Non-personalised ads unless the visitor opted in to personalisation.
 */
export function AdSenseLoader({ clientId, nonce }: { clientId: string; nonce?: string }) {
  const { consent } = useConsent();

  useEffect(() => {
    if (!consent?.ads) return;
    if (document.getElementById("adsense-lib")) return;
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = consent.personalized ? 0 : 1;
    const s = document.createElement("script");
    s.id = "adsense-lib";
    s.async = true;
    s.crossOrigin = "anonymous";
    if (nonce) s.nonce = nonce;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    document.head.appendChild(s);
  }, [consent, clientId, nonce]);

  return null;
}
