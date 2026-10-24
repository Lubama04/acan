// Mobile Lighthouse audit of a running server (default http://localhost:3000).
// Usage: node scripts/lighthouse.mjs [baseUrl]  — fails (exit 1) below the targets in TARGETS.
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PAGES = ["/", "/services", "/devis", "/journal", "/confidentialite"];
const TARGETS = { performance: 90, accessibility: 90, "best-practices": 90, seo: 95 };
const PORT = 9333;

const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
let failed = false;
try {
  for (const path of PAGES) {
    const { lhr } = await lighthouse(`${BASE}${path}`, {
      port: PORT,
      output: "json",
      logLevel: "error",
      onlyCategories: Object.keys(TARGETS),
      formFactor: "mobile",
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
      throttlingMethod: "simulate",
    });
    const scores = Object.fromEntries(Object.values(lhr.categories).map((c) => [c.id, Math.round(c.score * 100)]));
    const a = lhr.audits;
    console.log(
      path.padEnd(18),
      Object.entries(scores).map(([k, v]) => `${k}:${v}`).join("  "),
      `| LCP ${Math.round(a["largest-contentful-paint"].numericValue)}ms CLS ${a["cumulative-layout-shift"].numericValue.toFixed(3)} TBT ${Math.round(a["total-blocking-time"].numericValue)}ms`,
    );
    for (const [k, min] of Object.entries(TARGETS)) if ((scores[k] ?? 0) < min) failed = true;
    if (scores.seo < 100 || scores.accessibility < 100 || scores["best-practices"] < 100) {
      const issues = Object.values(lhr.audits)
        .filter((x) => x.score !== null && x.score < 1 && x.scoreDisplayMode === "binary")
        .map((x) => x.id);
      if (issues.length) console.log("   failing audits:", issues.join(", "));
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
