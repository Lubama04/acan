# Decision log

Each entry: decision, alternatives considered, reason. Newest last.

## D1 — npm instead of pnpm
- **Alternatives:** install pnpm globally (corepack).
- **Reason:** pnpm is not installed on the dev machine; npm works out of the box on Vercel. Lockfile `package-lock.json`.

## D2 — TypeScript 5.9 instead of 7.0
- **Alternatives:** TypeScript 7.0.2 (native compiler).
- **Reason:** Next.js 16.4 ships and tests against 5.x; 7.0 is too recent to rely on for a production build.

## D3 — Next.js 16.4.3
- **Reason:** latest stable at the time of writing; patches the October 2026 advisories (image optimiser RCE with SVG, `use cache` RCE, Server Actions DoS — fixed in 16.4.1).

## D4 — Retained logo: option A "Bulle Afrique"
- **Alternatives:** option B "Monogramme AM".
- **Reason:** keeps Africa + signal + palette from the original artwork while moving from "newsroom" (microphone, quill) to "agency" (speech bubble). Details in `design/DESIGN.md`.

## D5 — Fonts: Archivo + Source Sans 3
- **Alternatives:** Inter (too generic), Montserrat (closest to the old raster logo but overused).
- **Reason:** Archivo has character and is used in the logo; Source Sans 3 is very readable and light.

## D6 — Next.js server code instead of Supabase Edge Functions (SILS adaptation)
- **Alternatives:** Edge Functions `log-security-event`, `qualify-event` as written in the SILS document.
- **Reason:** the stack is Next.js on Vercel; server actions and route handlers already run server-side with
  validation, so a second runtime would add surface without benefit. Same responsibilities, same guarantees
  (service role only server-side, CORS not needed: same origin).

## D7 — Public forms insert through RLS with DB-level throttling
- **Alternatives:** server-only inserts with the service role (anonymous INSERT disabled).
- **Reason:** the first brief asked for public insert-only RLS, and the service-role key is not yet available.
  Abuse that bypasses the website is capped by triggers (per-IP 5 / 10 min, global 60 / 10 min) and
  constraints (consent, status pinned, `ip_hash` required). Switching to service-role-only inserts later is a
  one-line policy change.

## D8 — IP addresses are stored as salted hashes, never in clear
- **Alternative:** `ip_address inet` as in the SILS table design.
- **Reason:** data minimisation (loi 007/PR/2015); hashes are enough for rate limiting and correlation.

## D9 — Admin = role (user_roles) + e-mail allowlist + MFA (aal2), enforced in the database
- **Reason:** defence in depth; the UI checks are repeated by RLS (`private.is_admin()`), so a stolen password
  alone, a role without allowlist, or a session without MFA reads nothing.
- `has_role` is SECURITY DEFINER (needed to read role tables regardless of caller) with a pinned search_path,
  in the non-exposed `private` schema. All other functions are invoker or justified in comments.

## D10 — CSP with nonces (dynamic rendering) rather than static pages
- **Alternative:** static/ISR pages with a hash-based or looser CSP.
- **Reason:** requested by the brief and required for a strict policy compatible with AdSense
  ('strict-dynamic'). Data stays cached (`unstable_cache`), so the cost is a server render per request.

## D11 — No Cloudflare Turnstile for now
- **Reason:** honeypot + minimum fill time + DB throttle + Vercel rate-limit rule are in place; a CAPTCHA adds a
  third-party script and friction on slow connections. Revisit if spam appears (the security dashboard shows
  `honeypot_triggered` and `rate_limited` events).

## D12 — Ads only in the Journal, never on an empty page
- **Reason:** sober agency site; AdSense policy forbids ads on pages without publisher content; legal pages,
  forms and admin are ad-free by rule (`isAdFreePath`).

## D13 — Sponsor counting requires the service role
- **Reason:** counts used for billing must not be writable by visitors. Until `SUPABASE_SECRET_KEY` is set,
  sponsor ads display but are not counted (stated in /admin/publicite).

## D14 — Indexing disabled until the production domain exists
- **Reason:** previews on `*.vercel.app` must not be indexed (duplicate content). `NEXT_PUBLIC_ALLOW_INDEXING=true`
  is set only on production with the real domain.

## D15 — Vercel Firewall: two custom rules (Hobby plan)
- `am-rate-limit-forms`: POST on `/devis`, `/contact`, `/admin/login`, `/admin/mfa` → 10 per 60 s per IP, deny.
- `am-block-probe-paths`: `.env`, `.git`, WordPress, phpMyAdmin, server-status → deny.
- **Rollback:** `vercel firewall rules disable <name>` (or `remove`) then `vercel firewall publish`; or
  Vercel dashboard → acan → Firewall. Managed bot protection / OWASP rulesets need a Pro plan (not changed).

## D16 — No political partisan communication (default)
- **Reason:** brief lists it as out of scope by default; the sectors page states it. The direction can change it.

## D17 — Realtime alerting in the dashboard replaced by page refresh
- **Alternative:** Supabase Realtime subscription on `security_events`.
- **Reason:** would require exposing the table to Realtime and a client bundle on the admin page; e-mail alerts
  (Resend) cover high/critical events. Can be added later.

## D18 — Repository left public
- **Reason:** no answer received on visibility; secrets are not in Git and push protection is on. The segmentation
  document is strategic: making the repository private is recommended (owner's decision).
