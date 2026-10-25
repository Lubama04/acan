import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Short-lived HMAC tokens issued by the server and checked on the way back (form fill time,
// ad impressions and clicks). Key: RATE_LIMIT_SALT, domain-separated by a purpose prefix.

function key() {
  const k = process.env.RATE_LIMIT_SALT;
  if (!k && process.env.NODE_ENV === "production") {
    console.error("[security] RATE_LIMIT_SALT missing: tokens use the development key");
  }
  return k || "dev-only-token-key";
}

function mac(purpose: string, payload: string, exp: number) {
  return createHmac("sha256", key()).update(`${purpose}|${payload}|${exp}`).digest("base64url");
}

/** Token valid until `now + ttlMs`. Format: `<exp>.<mac>`. */
export function issueToken(purpose: string, payload: string, ttlMs: number, now = Date.now()): string {
  const exp = now + ttlMs;
  return `${exp}.${mac(purpose, payload, exp)}`;
}

export function verifyToken(purpose: string, payload: string, token: unknown, now = Date.now()): boolean {
  if (typeof token !== "string") return false;
  const m = /^(\d{10,15})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!m) return false;
  const exp = Number(m[1]);
  if (!Number.isFinite(exp) || exp < now) return false;
  const expected = Buffer.from(mac(purpose, payload, exp));
  const given = Buffer.from(m[2]!);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Form start token: proves when the server rendered the form (fill time can't be forged). */
export const FORM_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
export function issueFormToken(now = Date.now()) {
  return { issuedAt: now, token: issueToken("form", String(now), FORM_TOKEN_TTL_MS, now) };
}
export function verifyFormToken(issuedAt: number, token: unknown, now = Date.now()) {
  return verifyToken("form", String(issuedAt), token, now);
}

/** Ad token bound to one campaign, issued when the ad is rendered. */
export const AD_TOKEN_TTL_MS = 30 * 60 * 1000;
export const issueAdToken = (campaignId: string, now = Date.now()) =>
  issueToken("ad", campaignId, AD_TOKEN_TTL_MS, now);
export const verifyAdToken = (campaignId: string, token: unknown, now = Date.now()) =>
  verifyToken("ad", campaignId, token, now);

/** Proof sent with public form inserts; the database checks its SHA-256 fingerprint. */
export function formInsertProof(now = Date.now()) {
  const secret = process.env.FORM_SIGNING_SECRET;
  if (!secret) return null;
  return { form_ts: Math.floor(now / 1000), form_sig: secret };
}
