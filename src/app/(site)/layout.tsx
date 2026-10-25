import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ConsentProvider } from "@/components/consent/consent-provider";
import { AdSenseLoader } from "@/components/ads/adsense-loader";
import { JsonLd } from "@/components/seo/json-ld";
import { CONSENT_DEFAULT_SCRIPT } from "@/lib/consent";
import { getSettings } from "@/lib/settings";
import { organizationJsonLd } from "@/lib/seo";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, h] = await Promise.all([getSettings(), headers()]);
  const nonce = h.get("x-nonce") ?? undefined;
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const adsAvailable = Boolean(clientId && settings.adsense_enabled);

  return (
    <ConsentProvider adsAvailable={adsAvailable}>
      {adsAvailable && (
        // Consent Mode v2 defaults (all denied) must run before any Google tag.
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
      )}
      <a
        href="#contenu"
        className="focus:text-navy sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-semibold"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppButton />
      {adsAvailable && <AdSenseLoader clientId={clientId!} nonce={nonce} />}
      <JsonLd data={organizationJsonLd(settings)} />
    </ConsentProvider>
  );
}
