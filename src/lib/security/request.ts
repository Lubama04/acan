import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

const DEV_SALT = "dev-only-salt-change-me";

function salt() {
  const s = process.env.RATE_LIMIT_SALT;
  if (!s && process.env.NODE_ENV === "production") {
    console.error("[security] RATE_LIMIT_SALT missing: IP hashes use the development salt");
  }
  return s || DEV_SALT;
}

/** Salted SHA-256 (HMAC) of a value. Raw IPs are never stored. */
export function hashValue(value: string) {
  return createHmac("sha256", salt()).update(value).digest("hex");
}

export function clientIpFrom(h: Headers) {
  // Vercel sets x-real-ip / x-vercel-forwarded-for; fall back to the first x-forwarded-for hop.
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

export async function requestContext() {
  const h = await headers();
  const ip = clientIpFrom(h);
  return {
    ipHash: hashValue(ip),
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
    origin: h.get("origin"),
    host: h.get("x-forwarded-host") ?? h.get("host"),
  };
}

const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pagespeed|curl|wget|python-requests|httpclient|axios|node-fetch|go-http|java\//i;

export function isLikelyBot(userAgent: string) {
  return userAgent.length < 10 || BOT_UA.test(userAgent);
}

/** Same-origin check for route handlers (server actions already enforce it in Next.js). */
export function isSameOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
