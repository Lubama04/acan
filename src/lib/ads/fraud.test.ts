import { describe, expect, it } from "vitest";
import { classifyClick, classifyImpression, LIMITS } from "./fraud";
import { isLikelyBot } from "@/lib/security/request";

const okImpression = { isBot: false, validToken: true, sameSessionRecent: 0, ipImpressionsLastHour: 0 };
const okClick = {
  isBot: false,
  validToken: true,
  sameSiteNavigation: true,
  sessionClicksToday: 0,
  ipClicksLastHour: 0,
};

describe("ad fraud filtering", () => {
  it("flags bots before anything else", () => {
    expect(classifyImpression({ ...okImpression, isBot: true })).toBe("bot");
    expect(classifyClick({ ...okClick, isBot: true })).toBe("bot");
  });

  it("requires a valid server-issued token", () => {
    expect(classifyImpression({ ...okImpression, validToken: false })).toBe("invalid_token");
    expect(classifyClick({ ...okClick, validToken: false })).toBe("invalid_token");
  });

  it("refuses clicks that are not same-site navigations (embedded in another site)", () => {
    expect(classifyClick({ ...okClick, sameSiteNavigation: false })).toBe("invalid_token");
  });

  it("counts one impression per session window and caps per IP", () => {
    expect(classifyImpression(okImpression)).toBeNull();
    expect(classifyImpression({ ...okImpression, sameSessionRecent: 1 })).toBe("session_cap");
    expect(
      classifyImpression({ ...okImpression, ipImpressionsLastHour: LIMITS.impressionsPerIpPerHour }),
    ).toBe("ip_cap");
  });

  it("flags repeated clicks and IP floods", () => {
    expect(classifyClick(okClick)).toBeNull();
    expect(classifyClick({ ...okClick, sessionClicksToday: LIMITS.clicksPerSessionPerDay })).toBe(
      "repeat_click",
    );
    expect(classifyClick({ ...okClick, ipClicksLastHour: LIMITS.clicksPerIpPerHour })).toBe("ip_cap");
  });

  it("recognises common crawlers and scripts", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isLikelyBot("curl/8.4.0")).toBe(true);
    expect(isLikelyBot("")).toBe(true);
    expect(
      isLikelyBot(
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36",
      ),
    ).toBe(false);
  });
});
