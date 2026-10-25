import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

const base = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("parsePublicEnv", () => {
  it("accepts the minimal required variables", () => {
    const env = parsePublicEnv(base);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_ADSENSE_CLIENT_ID).toBeUndefined();
  });

  it("treats an empty AdSense ID as disabled", () => {
    expect(
      parsePublicEnv({ ...base, NEXT_PUBLIC_ADSENSE_CLIENT_ID: "" }).NEXT_PUBLIC_ADSENSE_CLIENT_ID,
    ).toBeUndefined();
  });

  it("rejects a malformed AdSense ID", () => {
    expect(() => parsePublicEnv({ ...base, NEXT_PUBLIC_ADSENSE_CLIENT_ID: "pub-123" })).toThrow();
  });

  it("rejects a WhatsApp number with a plus sign", () => {
    expect(() => parsePublicEnv({ ...base, NEXT_PUBLIC_WHATSAPP_NUMBER: "+23566000000" })).toThrow();
  });

  it("requires the Supabase URL", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "x" })).toThrow();
  });
});
