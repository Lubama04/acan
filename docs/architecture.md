# Architecture

## Overview

```
Browser ──HTTPS──▶ Vercel (Firewall rules ▶ Next.js 16 proxy.ts ▶ App Router)
                         │  Server Components / Server Actions / Route Handlers
                         ▼
                   Supabase (Postgres + RLS, Auth with TOTP MFA, Storage, pg_cron)
                         │
                         └─▶ Resend (optional, security alert e-mails)
Google AdSense: loaded in the browser only after explicit consent.
```

- **Hosting:** Vercel project `acan` (team `flaugust-dev`, Hobby plan), Git-connected to `Lubama04/acan`.
- **Database:** Supabase project `acan` (`qkzacuaqeracjluhusmr`, eu-west-3 Paris).

## Code layout

| Path | Role |
| --- | --- |
| `src/proxy.ts` | Per-request CSP nonce, security headers, probe-path 404, Supabase session refresh on `/admin` (no authorisation decisions here) |
| `src/app/(site)/` | Public pages (French). Layout adds header, footer, consent, WhatsApp, JSON-LD |
| `src/app/admin/` | `login`, `mfa` (public) and `(panel)/` (protected back-office) |
| `src/app/actions/forms.ts` | Public form server actions (quote, contact, newsletter) |
| `src/app/api/ads/` | Sponsor impression (POST) and click redirect (GET) |
| `src/app/ads.txt`, `.well-known/security.txt`, `sitemap.ts`, `robots.ts` | Technical SEO and policy files |
| `src/lib/supabase/` | `public.ts` (cookie-less anon, cached reads + public inserts), `server.ts` (user session), `admin.ts` (service role, server only, optional) |
| `src/lib/security/` | CSP builder, request context + IP hashing, injection heuristics, SILS events/qualification, alerts, score |
| `src/lib/ads/` | Fraud classification (pure), event recording, ads.txt |
| `src/lib/validation/forms.ts` | Zod schemas shared by client and server (strict: unknown keys rejected) |
| `src/components/` | Layout, ads, consent, forms, content, SEO components |
| `supabase/migrations/` | Versioned SQL (applied to the remote project; file names = applied versions) |
| `supabase/tests/rls.test.sql` | RLS regression tests (transaction rolled back) |
| `scripts/brand/build.mjs` | Generates logos, favicons, icons and OG image from vector sources |
| `e2e/` | Playwright: pages, headers, quote journey, axe accessibility |

## Data model (public schema)

| Table | Public access | Admin access | Notes |
| --- | --- | --- | --- |
| `site_settings` | read `is_public` rows | read/write | Legal identifiers, feature flags |
| `services`, `packages`, `segments`, `team_members`, `case_studies` | read published | editors write, admins delete | Case studies require `client_consent_ref` to publish |
| `posts` | read published (past date) | editors write, admins delete | Sponsored posts must name the sponsor |
| `leads`, `contact_messages`, `newsletter_subscribers` | **insert only** (status pinned, consent required, ip_hash required) | admins read/update/delete | Per-IP (5/10 min) and global (60/10 min) throttle triggers |
| `ad_slots` | read | admins update | Geometry is public config |
| `ad_campaigns` | read active within dates | admins CRUD | Created inactive |
| `ad_events` | none | admins read | Written by the server (service role) only |
| `security_events` | none | admins read | Immutable (no update/delete policy), service-role insert |
| `detection_rules` | none | admins read/update; insert only disabled proposals | |
| `incidents`, `security_memory`, `blocked_entities` | none | admins | Blocks always expire (≤ 7 days) |
| `rate_limits` | none (no policy) | — | Only via `consume_rate_limit` (service role) |
| `admin_allowlist`, `user_roles` | none | admins read | Roles granted by SQL only |
| `admin_audit_log` | none | admins read | Trigger-written, immutable |

Helper functions live in the non-exposed `private` schema: `has_role`, `is_admin` (role + allowlist + `aal2`),
`is_editor`, `touch_updated_at`, `audit_admin_change`, `throttle_public_insert`, `purge_expired_data` (pg_cron, daily 03:15 UTC).

## Caching and rendering

Pages render dynamically (the CSP nonce requires it). Data reads are cached with `unstable_cache`
(settings and content 5 min, ads 1 min) and invalidated by tag from admin actions (`updateTag`).

## Advertising flow

`AdSlot(slot)` → active sponsor campaign for the slot (rotation per minute) → else AdSense unit if
`NEXT_PUBLIC_ADSENSE_CLIENT_ID` + `adsense_enabled` + slot ID + visitor consent → else house ad.
Slots are only placed in the Journal; `isAdFreePath()` lists forbidden routes.
Impressions: client beacon after 1 s at 50 % visibility → server checks origin, campaign, bots, session cap.
Clicks: `/api/ads/click/:id` → destination read from DB (no open redirect) → bot, session and IP caps.

## Internationalisation

French only today. `LOCALES` in `src/lib/site.ts` declares `ar` (RTL) and `en`; components use logical CSS
properties (`ps-`, `me-`, `start`, `end`) and `hreflang` alternates are emitted. Adding a locale means a `[locale]`
segment and translated content columns or tables.

## Environments

| Variable | Dev | Preview | Production |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `_PUBLISHABLE_KEY` | `.env.local` | set | set |
| `RATE_LIMIT_SALT` | optional | set | set |
| `SUPABASE_SECRET_KEY` | optional | **to set** | **to set** |
| `NEXT_PUBLIC_SITE_URL` | localhost | unset | to set with the domain |
| `NEXT_PUBLIC_ALLOW_INDEXING` | — | never | `true` once the domain is live |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `RESEND_API_KEY`, `ALERT_EMAIL_TO` | — | optional | to set |
