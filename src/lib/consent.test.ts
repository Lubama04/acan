import { describe, expect, it } from "vitest";
import { consentModeSignals, parseConsent, serializeConsent } from "./consent";

describe("consent", () => {
  it("round-trips a choice", () => {
    const c = { ads: true, personalized: false };
    expect(parseConsent(serializeConsent(c))).toEqual(c);
  });

  it("never stores personalised consent without ads consent", () => {
    expect(serializeConsent({ ads: false, personalized: true })).toBe("v1.ads-0.pers-0");
  });

  it("rejects malformed cookies", () => {
    expect(parseConsent("v1.ads-1")).toBeNull();
    expect(parseConsent("ads=1")).toBeNull();
    expect(parseConsent(undefined)).toBeNull();
  });

  it("maps to Consent Mode v2 with non-personalised ads by default", () => {
    expect(consentModeSignals({ ads: true, personalized: false })).toEqual({
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    expect(consentModeSignals({ ads: false, personalized: false }).ad_storage).toBe("denied");
  });
});
