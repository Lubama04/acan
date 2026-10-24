import { expect, test } from "@playwright/test";

const PAGES = [
  "/",
  "/agence",
  "/services",
  "/services/relations-presse",
  "/secteurs",
  "/journal",
  "/devis",
  "/publicite",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
  "/cookies",
  "/cgu",
  "/contenus-sponsorises",
];

test.describe("navigation and pages", () => {
  for (const path of PAGES) {
    test(`${path} renders with one h1, lang=fr and no console error`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "fr");
      await expect(page.locator("h1")).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  }

  test("main navigation reaches the services page", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByLabel("Ouvrir le menu").click();
    await page
      .getByRole("navigation", { name: isMobile ? "Navigation mobile" : "Navigation principale" })
      .getByRole("link", { name: "Services" })
      .click();
    await expect(page).toHaveURL(/\/services$/);
  });

  test("hidden case studies page returns 404 while the flag is off", async ({ page }) => {
    const res = await page.goto("/realisations");
    expect(res?.status()).toBe(404);
  });

  test("legal pages never claim registration and show the pending status", async ({ page }) => {
    await page.goto("/mentions-legales");
    await expect(page.getByText(/en cours d'immatriculation/).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/HAMA/);
  });
});

test.describe("security headers and endpoints", () => {
  test("pages carry a nonce CSP and hardening headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("probe paths are refused", async ({ request }) => {
    expect((await request.get("/.env")).status()).toBe(404);
    expect((await request.get("/wp-login.php")).status()).toBe(404);
  });

  test("admin area redirects anonymous visitors to login", async ({ page }) => {
    await page.goto("/admin/securite");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("ad click endpoint never redirects off-site for unknown campaigns", async ({ request }) => {
    const res = await request.get("/api/ads/click/00000000-0000-4000-8000-000000000000", { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    expect(new URL(res.headers()["location"]!, "http://x").pathname).toBe("/");
  });

  test("impression endpoint rejects cross-origin posts", async ({ request }) => {
    const res = await request.post("/api/ads/impression", {
      headers: { origin: "https://evil.example" },
      data: { campaignId: "00000000-0000-4000-8000-000000000000" },
    });
    expect(res.status()).toBe(403);
  });

  test("security.txt and ads.txt are served", async ({ request }) => {
    const sec = await request.get("/.well-known/security.txt");
    expect(sec.status()).toBe(200);
    expect(await sec.text()).toMatch(/^Contact: /m);
    expect((await request.get("/ads.txt")).status()).toBe(200);
  });

  test("robots blocks indexing outside production", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  });
});
