// Content-Security-Policy builder. Nonce-based with 'strict-dynamic' (Google's recommended
// pattern for AdSense). AdSense origins are only added when an AdSense client ID is configured.

export type CspOptions = {
  nonce: string;
  supabaseUrl?: string;
  adsense: boolean;
  dev?: boolean;
};

const ADSENSE = {
  connect: [
    "https://pagead2.googlesyndication.com",
    "https://*.adtrafficquality.google",
    "https://*.google.com",
    "https://*.doubleclick.net",
  ],
  frame: [
    "https://googleads.g.doubleclick.net",
    "https://tpc.googlesyndication.com",
    "https://*.googlesyndication.com",
    "https://www.google.com",
    "https://*.adtrafficquality.google",
  ],
};

export function buildCsp({ nonce, supabaseUrl, adsense, dev = false }: CspOptions): string {
  const scriptSrc = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`];
  // 'strict-dynamic' makes browsers ignore host lists and 'unsafe-inline'; https: is a fallback for
  // older browsers only. AdSense requires 'unsafe-eval'; React dev tooling needs it in development.
  if (adsense) scriptSrc.push(`'unsafe-eval'`, "https:");
  else if (dev) scriptSrc.push(`'unsafe-eval'`);

  const connectSrc = [`'self'`];
  if (supabaseUrl) connectSrc.push(supabaseUrl, supabaseUrl.replace(/^https:/, "wss:"));
  if (adsense) connectSrc.push(...ADSENSE.connect);
  if (dev) connectSrc.push("ws:");

  const directives: Record<string, string[]> = {
    "default-src": [`'self'`],
    "script-src": scriptSrc,
    // Inline style attributes are used by next/image and the ad iframes; no inline <style> injection risk
    // for scripts since script-src is nonce-based.
    "style-src": [`'self'`, `'unsafe-inline'`],
    "img-src": [`'self'`, "data:", "blob:", "https:"],
    "font-src": [`'self'`],
    "connect-src": connectSrc,
    "frame-src": adsense ? ADSENSE.frame : [`'none'`],
    "frame-ancestors": [`'none'`],
    "object-src": [`'none'`],
    "base-uri": [`'none'`],
    "form-action": [`'self'`],
    "manifest-src": [`'self'`],
    "worker-src": [`'self'`, "blob:"],
  };
  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

export const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};
