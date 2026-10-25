"use client";

import { useEffect, useRef } from "react";

/**
 * Counts a sponsor impression once at least half of the ad has been visible for one second.
 * Requires JavaScript and a real viewport, which already filters most crawlers; the server
 * applies bot and per-session filtering on top.
 */
export function ImpressionBeacon({ campaignId, token }: { campaignId: string; token: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = ref.current?.parentElement;
    if (!target || !("IntersectionObserver" in window)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          timer = setTimeout(() => {
            const body = JSON.stringify({ campaignId, token });
            // text/plain keeps the beacon a "simple" request (no CORS preflight); the server parses JSON.
            if (!navigator.sendBeacon?.("/api/ads/impression", new Blob([body], { type: "text/plain" }))) {
              void fetch("/api/ads/impression", { method: "POST", body, keepalive: true });
            }
            observer.disconnect();
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [campaignId, token]);

  return <span ref={ref} hidden />;
}
