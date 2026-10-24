"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useConsent } from "@/components/consent/consent-provider";

/** One AdSense unit. Without consent it renders the fallback (house ad) in the same reserved box. */
export function AdSenseUnit({ clientId, slotId, fallback }: { clientId: string; slotId: string; fallback: ReactNode }) {
  const { consent } = useConsent();
  const pushed = useRef(false);

  useEffect(() => {
    if (!consent?.ads || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // The library may be blocked (ad blocker, network): the reserved box simply stays empty.
    }
  }, [consent]);

  if (!consent?.ads) return <>{fallback}</>;
  return (
    <ins
      className="adsbygoogle block size-full"
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="false"
    />
  );
}
