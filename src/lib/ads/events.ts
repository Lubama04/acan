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

export async function recordAdEvent(campaignId: string, type: "impression" | "click") {
  const db = getServiceClient();
  if (!db) return; // Counting requires SUPABASE_SECRET_KEY (server-side writes only).

  const ctx = await requestContext();
  const session = await sessionHash();
  const isBot = isLikelyBot(ctx.userAgent);
  const now = Date.now();

  let flag;
  if (type === "impression") {
    const { count } = await db
      .from("ad_events")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("event_type", "impression")
      .eq("session_hash", session)
      .eq("flagged", false)
      .gte("created_at", new Date(now - LIMITS.impressionWindowMs).toISOString());
    flag = classifyImpression({ isBot, sameSessionRecent: count ?? 0 });
  } else {
    const [sessionClicks, ipClicks] = await Promise.all([
      db
        .from("ad_events")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("event_type", "click")
        .eq("session_hash", session)
        .gte("created_at", new Date(now - 86_400_000).toISOString()),
      db
        .from("ad_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "click")
        .eq("ip_hash", ctx.ipHash)
        .gte("created_at", new Date(now - 3_600_000).toISOString()),
    ]);
    flag = classifyClick({
      isBot,
      sessionClicksToday: sessionClicks.count ?? 0,
      ipClicksLastHour: ipClicks.count ?? 0,
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

  if (type === "click" && (flag === "ip_cap" || flag === "repeat_click")) {
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
