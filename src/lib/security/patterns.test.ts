import { describe, expect, it } from "vitest";
import { detectSuspiciousPayload } from "./patterns";

describe("detectSuspiciousPayload", () => {
  it("flags classic injection payloads", () => {
    expect(detectSuspiciousPayload(["' OR '1'='1"])).toContain("sql_injection");
    expect(detectSuspiciousPayload(["1 UNION SELECT password FROM users"])).toContain("sql_injection");
    expect(detectSuspiciousPayload(["<script>alert(1)</script>"])).toContain("xss");
    expect(detectSuspiciousPayload(["<img src=x onerror=alert(1)>"])).toContain("xss");
    expect(detectSuspiciousPayload(["../../etc/passwd"])).toContain("path_traversal");
    expect(detectSuspiciousPayload(["${jndi:ldap://x}"])).toContain("template_injection");
  });

  it("does not flag ordinary French business text", () => {
    expect(
      detectSuspiciousPayload([
        "Bonjour, nous organisons un forum le 12 mars à N'Djamena et voudrions une couverture photo et vidéo.",
        "Union des femmes commerçantes : sélection des meilleurs projets",
        "Notre budget est de 1 à 3 millions FCFA, est-ce possible ?",
      ]),
    ).toEqual([]);
  });
});
