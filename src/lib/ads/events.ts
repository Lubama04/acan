import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { getServiceClient } from "@/lib/supabase/admin";
import { hashValue, isLikelyBot, requestContext } from "@/lib/security/request";
import { logSecurityEvent } from "@/lib/security/events";
import { classifyClick, classifyImpression, LIMITS } from "./fraud";

const SESSION_COOKIE = "am_ad_sid";

/** Ad-measurement session id: random, first-party, httpOnly, 30 minutes, no personal data. */
async function sessionHash() {
  const jar = await cookies();
  let sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid || !/^[0-9a-f-]{36}$/.test(sid)) {
    sid = randomUUID();
    jar.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 1800,
      path: "/api/ads",
    });
  }
  return hashValue(`sid:${sid}`);
}

export type AdEventContext = {
  /** Server-issued render token for this campaign was present and valid. */
  validToken: boolean;
  /** Click only: the browser reported a same-origin navigation (Sec-Fetch-Site). */
  sameSiteNavigation?: boolean;
};

export async function recordAdEvent(campaignId: string, type: "impression" | "click", evt: AdEventContext) {
  const db = getServiceClient();
  if (!db) return; // Counting requires SUPABASE_SECRET_KEY (server-side writes only).

  const ctx = await requestContext();

  // Flood guard: past this volume from one IP, nothing is stored (the table cannot be flooded).
  const { data: allowed, error: rlError } = await db.rpc("consume_rate_limit", {
    p_bucket: type === "click" ? "ad_click" : "ad_impression",
    p_key_hash: ctx.ipHash,
    p_max: LIMITS.storedEventsPerIpPerHour,
    p_window_seconds: 3600,
  });
  if (rlError || allowed === false) return;

  const session = await sessionHash();
  const isBot = isLikelyBot(ctx.userAgent);
  const now = Date.now();
  const since = (ms: number) => new Date(now - ms).toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);

  let flag;
  if (type === "impression") {
    const [sameSession, ipImpressions] = await Promise.all([
      count(
        db
          .from("ad_events")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaignId)
          .eq("event_type", "impression")
          .eq("session_hash", session)
          .eq("flagged", false)
          .gte("created_at", since(LIMITS.impressionWindowMs)),
      ),
      count(
        db
          .from("ad_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "impression")
          .eq("ip_hash", ctx.ipHash)
          .eq("flagged", false)
          .gte("created_at", since(3_600_000)),
      ),
    ]);
    flag = classifyImpression({
      isBot,
      validToken: evt.validToken,
      sameSessionRecent: sameSession,
      ipImpressionsLastHour: ipImpressions,
    });
  } else {
    const [sessionClicks, ipClicks] = await Promise.all([
      count(
        db
          .from("ad_events")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaignId)
          .eq("event_type", "click")
          .eq("session_hash", session)
          .gte("created_at", since(86_400_000)),
      ),
      count(
        db
          .from("ad_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "click")
          .eq("ip_hash", ctx.ipHash)
          .gte("created_at", since(3_600_000)),
      ),
    ]);
    flag = classifyClick({
      isBot,
      validToken: evt.validToken,
      sameSiteNavigation: Boolean(evt.sameSiteNavigation),
      sessionClicksToday: sessionClicks,
      ipClicksLastHour: ipClicks,
    });
  }

  const { error } = await db.from("ad_events").insert({
    campaign_id: campaignId,
    event_type: type,
    session_hash: session,
    ip_hash: ctx.ipHash,
    flagged: flag !== null,
    flag_reason: flag,
  });
  if (error) console.error("[ads] event insert failed", error.code);

  if (type === "click" && (flag === "ip_cap" || flag === "repeat_click" || flag === "invalid_token")) {
    await logSecurityEvent({
      type: "ad_fraud_suspected",
      severity: "low",
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      endpoint: "/api/ads/click",
      summary: { reason: flag },
    });
  }
}
