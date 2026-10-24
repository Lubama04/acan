import { describe, expect, it } from "vitest";
import { adsTxt } from "./ads-txt";

describe("adsTxt", () => {
  it("derives the seller line from the AdSense client ID", () => {
    expect(adsTxt("ca-pub-1234567890123456")).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  });
  it("is empty without a valid ID", () => {
    expect(adsTxt(undefined)).toBe("");
    expect(adsTxt("pub-123")).toBe("");
    expect(adsTxt("ca-pub-123\ngoogle.com, pub-999")).toBe("");
  });
});
