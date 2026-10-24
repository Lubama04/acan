// Click/impression filtering rules. Pure functions so they can be unit tested.

export const LIMITS = {
  /** Same session, same campaign: one counted impression per window. */
  impressionWindowMs: 30 * 60 * 1000,
  /** Same session, same campaign: clicks counted per day before flagging. */
  clicksPerSessionPerDay: 2,
  /** Same IP hash, all campaigns: clicks per hour before flagging. */
  clicksPerIpPerHour: 10,
};

export type FlagReason = "bot" | "repeat_click" | "ip_cap" | "session_cap";

export function classifyImpression(input: { isBot: boolean; sameSessionRecent: number }): FlagReason | null {
  if (input.isBot) return "bot";
  if (input.sameSessionRecent > 0) return "session_cap";
  return null;
}

export function classifyClick(input: {
  isBot: boolean;
  sessionClicksToday: number;
  ipClicksLastHour: number;
}): FlagReason | null {
  if (input.isBot) return "bot";
  if (input.sessionClicksToday >= LIMITS.clicksPerSessionPerDay) return "repeat_click";
  if (input.ipClicksLastHour >= LIMITS.clicksPerIpPerHour) return "ip_cap";
  return null;
}
