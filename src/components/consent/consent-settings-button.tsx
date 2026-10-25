"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/consent";

export function ConsentSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      Gérer les cookies
    </button>
  );
}
