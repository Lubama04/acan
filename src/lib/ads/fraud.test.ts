import { describe, expect, it } from "vitest";
import { classifyClick, classifyImpression, LIMITS } from "./fraud";
import { isLikelyBot } from "@/lib/security/request";

describe("ad fraud filtering", () => {
  it("flags bots before anything else", () => {
    expect(classifyImpression({ isBot: true, sameSessionRecent: 0 })).toBe("bot");
    expect(classifyClick({ isBot: true, sessionClicksToday: 0, ipClicksLastHour: 0 })).toBe("bot");
  });

  it("counts one impression per session window", () => {
    expect(classifyImpression({ isBot: false, sameSessionRecent: 0 })).toBeNull();
    expect(classifyImpression({ isBot: false, sameSessionRecent: 1 })).toBe("session_cap");
  });

  it("flags repeated clicks and IP floods", () => {
    expect(classifyClick({ isBot: false, sessionClicksToday: 0, ipClicksLastHour: 0 })).toBeNull();
    expect(classifyClick({ isBot: false, sessionClicksToday: LIMITS.clicksPerSessionPerDay, ipClicksLastHour: 0 })).toBe(
      "repeat_click",
    );
    expect(classifyClick({ isBot: false, sessionClicksToday: 0, ipClicksLastHour: LIMITS.clicksPerIpPerHour })).toBe(
      "ip_cap",
    );
  });

  it("recognises common crawlers and scripts", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isLikelyBot("curl/8.4.0")).toBe(true);
    expect(isLikelyBot("")).toBe(true);
    expect(
      isLikelyBot("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36"),
    ).toBe(false);
  });
});
