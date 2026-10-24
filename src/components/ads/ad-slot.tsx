import Link from "next/link";
import { getAdSlots, getCampaignForSlot } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import type { AdSlotKey } from "@/lib/types";
import { AdSenseUnit } from "./adsense-unit";
import { ImpressionBeacon } from "./impression-beacon";

// Reserved boxes (no layout shift). Mobile sizes for wide formats; sidebar hidden below lg.
const BOX: Record<AdSlotKey, string> = {
  header: "h-[100px] w-[320px] md:h-[90px] md:w-[728px]",
  footer: "h-[100px] w-[320px] md:h-[90px] md:w-[728px]",
  in_article: "h-[250px] w-[300px]",
  sidebar: "h-[600px] w-[300px]",
};

function HouseAd({ slot }: { slot: AdSlotKey }) {
  const tall = slot === "sidebar" || slot === "in_article";
  return (
    <Link
      href="/devis"
      className={`flex size-full flex-col justify-center gap-2 bg-navy px-5 text-white no-underline hover:bg-[#0a2f63] ${
        tall ? "items-start" : "items-start md:flex-row md:items-center md:justify-between"
      }`}
    >
      <span className="font-heading text-lg leading-tight font-bold">
        Une communication claire pour votre organisation
      </span>
      <span className="text-sm font-semibold text-gold-light underline">Demander un devis</span>
    </Link>
  );
}

/**
 * Advertising slot. Priority: direct sponsor → Google AdSense (consent required) → house ad.
 * Never place it on legal pages, forms or the admin area (see isAdFreePath).
 */
export async function AdSlot({ slot, className = "" }: { slot: AdSlotKey; className?: string }) {
  const [slots, settings, campaign] = await Promise.all([getAdSlots(), getSettings(), getCampaignForSlot(slot)]);
  const config = slots.find((s) => s.key === slot);
  if (config && !config.enabled) return null;

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const adsenseReady = Boolean(clientId && settings.adsense_enabled && config?.adsense_slot_id);
  const label = campaign ? campaign.disclosure : "Publicité";
  const hiddenOnMobile = slot === "sidebar" ? "hidden lg:block" : "";

  return (
    <aside aria-label={label} className={`${hiddenOnMobile} ${className}`}>
      <p className="mb-1 text-center text-xs font-semibold tracking-wide text-slate uppercase">{label}</p>
      <div className={`relative mx-auto overflow-hidden rounded-sm border border-border bg-paper ${BOX[slot]}`}>
        {campaign ? (
          <a
            href={`/api/ads/click/${campaign.id}`}
            rel="sponsored noopener"
            target="_blank"
            className="block size-full"
          >
            {/* Remote advertiser creative, dimensions fixed by the slot. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.image_url}
              alt={`${campaign.image_alt} (${campaign.disclosure.toLowerCase()} : ${campaign.advertiser})`}
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <ImpressionBeacon campaignId={campaign.id} />
          </a>
        ) : adsenseReady ? (
          <AdSenseUnit clientId={clientId!} slotId={config!.adsense_slot_id!} fallback={<HouseAd slot={slot} />} />
        ) : (
          <HouseAd slot={slot} />
        )}
      </div>
    </aside>
  );
}
