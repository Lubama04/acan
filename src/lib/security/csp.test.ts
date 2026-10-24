import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp";

describe("buildCsp", () => {
  it("is nonce-based and locks down framing, objects and base URI", () => {
    const csp = buildCsp({ nonce: "abc123", adsense: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  });

  it("only opens Google ad origins when AdSense is enabled", () => {
    const off = buildCsp({ nonce: "n", adsense: false });
    const on = buildCsp({ nonce: "n", adsense: true });
    expect(off).not.toContain("googlesyndication");
    expect(on).toContain("https://pagead2.googlesyndication.com");
    expect(on).toContain("frame-src https://googleads.g.doubleclick.net");
  });

  it("allows the Supabase project for API and realtime connections", () => {
    const csp = buildCsp({ nonce: "n", adsense: false, supabaseUrl: "https://x.supabase.co" });
    expect(csp).toContain("connect-src 'self' https://x.supabase.co wss://x.supabase.co");
  });
});
