import { describe, expect, it } from "vitest";
import {
  issueAdToken,
  issueFormToken,
  issueToken,
  verifyAdToken,
  verifyFormToken,
  verifyToken,
} from "./tokens";

describe("server tokens", () => {
  it("accepts a fresh token and rejects tampering", () => {
    const t = issueToken("p", "payload", 60_000);
    expect(verifyToken("p", "payload", t)).toBe(true);
    expect(verifyToken("p", "other", t)).toBe(false);
    expect(verifyToken("other-purpose", "payload", t)).toBe(false);
    const [exp, sig] = t.split(".");
    expect(verifyToken("p", "payload", `${Number(exp) + 1000}.${sig}`)).toBe(false);
    expect(verifyToken("p", "payload", "garbage")).toBe(false);
    expect(verifyToken("p", "payload", undefined)).toBe(false);
  });

  it("expires", () => {
    const now = Date.now();
    const t = issueToken("p", "x", 1000, now);
    expect(verifyToken("p", "x", t, now + 2000)).toBe(false);
  });

  it("binds form tokens to the render time (fill time cannot be forged)", () => {
    const { issuedAt, token } = issueFormToken();
    expect(verifyFormToken(issuedAt, token)).toBe(true);
    expect(verifyFormToken(issuedAt - 60_000, token)).toBe(false);
  });

  it("binds ad tokens to one campaign", () => {
    const t = issueAdToken("11111111-1111-4111-8111-111111111111");
    expect(verifyAdToken("11111111-1111-4111-8111-111111111111", t)).toBe(true);
    expect(verifyAdToken("22222222-2222-4222-8222-222222222222", t)).toBe(false);
  });
});
