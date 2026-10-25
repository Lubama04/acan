// Click/impression filtering rules. Pure functions so they can be unit tested.

export const LIMITS = {
  /** Same session, same campaign: one counted impression per window. */
  impressionWindowMs: 30 * 60 * 1000,
  /** Same IP hash, all campaigns: counted impressions per hour (shared NAT is common on mobile). */
  impressionsPerIpPerHour: 60,
  /** Same session, same campaign: clicks counted per day before flagging. */
  clicksPerSessionPerDay: 2,
  /** Same IP hash, all campaigns: clicks per hour before flagging. */
  clicksPerIpPerHour: 10,
  /** Beyond this many ad requests per IP per hour, events are not stored at all (table flood guard). */
  storedEventsPerIpPerHour: 300,
};

export type FlagReason = "bot" | "repeat_click" | "ip_cap" | "session_cap" | "invalid_token";

export function classifyImpression(input: {
  isBot: boolean;
  validToken: boolean;
  sameSessionRecent: number;
  ipImpressionsLastHour: number;
}): FlagReason | null {
  if (input.isBot) return "bot";
  if (!input.validToken) return "invalid_token";
  if (input.sameSessionRecent > 0) return "session_cap";
  if (input.ipImpressionsLastHour >= LIMITS.impressionsPerIpPerHour) return "ip_cap";
  return null;
}

export function classifyClick(input: {
  isBot: boolean;
  validToken: boolean;
  sameSiteNavigation: boolean;
  sessionClicksToday: number;
  ipClicksLastHour: number;
}): FlagReason | null {
  if (input.isBot) return "bot";
  // A click must come from our own page (Sec-Fetch-Site: same-origin) with a fresh render token:
  // an <img src=/api/ads/click/…> on another site carries neither.
  if (!input.validToken || !input.sameSiteNavigation) return "invalid_token";
  if (input.sessionClicksToday >= LIMITS.clicksPerSessionPerDay) return "repeat_click";
  if (input.ipClicksLastHour >= LIMITS.clicksPerIpPerHour) return "ip_cap";
  return null;
}
