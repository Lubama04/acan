import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getServiceClient } from "@/lib/supabase/admin";
import type {
  AdCampaign,
  AdSlotKey,
  CaseStudy,
  Package,
  Post,
  Segment,
  Service,
  TeamMember,
} from "@/lib/types";

const REVALIDATE = 300;

function logError(scope: string, error: { code?: string; message?: string } | null) {
  // Error codes only: messages can echo user input.
  if (error) console.error(`[content] ${scope} failed`, error.code ?? "unknown");
}

export const getServices = unstable_cache(
  async (): Promise<Service[]> => {
    const { data, error } = await createPublicClient()
      .from("services")
      .select("id, slug, title, summary, body_md, deliverables, process, position")
      .order("position");
    logError("services", error);
    return (data as Service[]) ?? [];
  },
  ["services"],
  { revalidate: REVALIDATE, tags: ["services"] },
);

export async function getService(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

export const getPackages = unstable_cache(
  async (): Promise<Package[]> => {
    const { data, error } = await createPublicClient()
      .from("packages")
      .select("id, slug, name, audience, includes, price_label, position")
      .order("position");
    logError("packages", error);
    return (data as Package[]) ?? [];
  },
  ["packages"],
  { revalidate: REVALIDATE, tags: ["packages"] },
);

export const getSegments = unstable_cache(
  async (): Promise<Segment[]> => {
    const { data, error } = await createPublicClient()
      .from("segments")
      .select("id, slug, title, summary, needs, approach, key_message, position")
      .order("position");
    logError("segments", error);
    return (data as Segment[]) ?? [];
  },
  ["segments"],
  { revalidate: REVALIDATE, tags: ["segments"] },
);

export const getTeam = unstable_cache(
  async (): Promise<TeamMember[]> => {
    const { data, error } = await createPublicClient()
      .from("team_members")
      .select("id, full_name, role, bio, experience, photo_url, photo_alt")
      .order("position");
    logError("team", error);
    return (data as TeamMember[]) ?? [];
  },
  ["team"],
  { revalidate: REVALIDATE, tags: ["team"] },
);

export const getCaseStudies = unstable_cache(
  async (): Promise<CaseStudy[]> => {
    const { data, error } = await createPublicClient()
      .from("case_studies")
      .select("id, slug, client_name, title, summary, challenge, work_done, results, published_at")
      .order("published_at", { ascending: false });
    logError("case_studies", error);
    return (data as CaseStudy[]) ?? [];
  },
  ["case-studies"],
  { revalidate: REVALIDATE, tags: ["case-studies"] },
);

const POST_FIELDS =
  "id, slug, title, excerpt, body_md, category, cover_url, cover_alt, author_name, sponsored, sponsor_name, seo_title, seo_description, status, published_at, updated_at";

export const getPosts = unstable_cache(
  async (): Promise<Post[]> => {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select(POST_FIELDS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100);
    logError("posts", error);
    return (data as Post[]) ?? [];
  },
  ["posts"],
  { revalidate: REVALIDATE, tags: ["posts"] },
);

export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug) ?? null;
}

export const getActiveCampaigns = unstable_cache(
  async (): Promise<AdCampaign[]> => {
    const { data, error } = await createPublicClient()
      .from("ad_campaigns")
      .select(
        "id, slot_key, advertiser, disclosure, image_url, image_alt, target_url, starts_at, ends_at, max_impressions",
      );
    logError("ad_campaigns", error);
    return (data as AdCampaign[]) ?? [];
  },
  ["ad-campaigns"],
  { revalidate: 60, tags: ["ads"] },
);

/**
 * Campaigns that reached their `max_impressions` (unflagged impressions). Needs the service role to
 * read ad_events; without it nothing is counted, so nothing can be capped either.
 */
const getCappedCampaignIds = unstable_cache(
  async (): Promise<string[]> => {
    const db = getServiceClient();
    if (!db) return [];
    const capped = (await getActiveCampaigns()).filter((c) => c.max_impressions);
    const results = await Promise.all(
      capped.map(async (c) => {
        const { count } = await db
          .from("ad_events")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", c.id)
          .eq("event_type", "impression")
          .eq("flagged", false);
        return (count ?? 0) >= (c.max_impressions ?? Infinity) ? c.id : null;
      }),
    );
    return results.filter((id): id is string => id !== null);
  },
  ["ad-capped"],
  { revalidate: 60, tags: ["ads"] },
);

/** A campaign that can be served (and counted) right now: active, in its dates, under its cap. */
export async function getServableCampaign(id: string): Promise<AdCampaign | null> {
  const now = Date.now();
  const [list, capped] = await Promise.all([getActiveCampaigns(), getCappedCampaignIds()]);
  const c = list.find((x) => x.id === id);
  if (!c || capped.includes(c.id)) return null;
  return Date.parse(c.starts_at) <= now && Date.parse(c.ends_at) > now ? c : null;
}

export async function getCampaignForSlot(slot: AdSlotKey): Promise<AdCampaign | null> {
  const now = Date.now();
  const [all, capped] = await Promise.all([getActiveCampaigns(), getCappedCampaignIds()]);
  const list = all.filter(
    (c) =>
      c.slot_key === slot &&
      !capped.includes(c.id) &&
      Date.parse(c.starts_at) <= now &&
      Date.parse(c.ends_at) > now,
  );
  if (list.length === 0) return null;
  // Simple rotation by minute so concurrent campaigns share the slot.
  return list[Math.floor(now / 60000) % list.length] ?? null;
}

export const getAdSlots = unstable_cache(
  async () => {
    const { data, error } = await createPublicClient()
      .from("ad_slots")
      .select("key, label, width, height, enabled, adsense_slot_id");
    logError("ad_slots", error);
    return (data ?? []) as {
      key: AdSlotKey;
      label: string;
      width: number;
      height: number;
      enabled: boolean;
      adsense_slot_id: string | null;
    }[];
  },
  ["ad-slots"],
  { revalidate: 300, tags: ["ads"] },
);
