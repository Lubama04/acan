# CLAUDE.md — Africa Média (agency website)

Website of « Agence de Communication Africa Média », a communication agency based in Chad
(SARL being incorporated: RCCM and NIF pending). The promoter alone carries legal
responsibility, so everything published must be accurate, verifiable and cautious.

## Stack

- Next.js 16.4 (App Router, Turbopack), React 19.3, TypeScript 5.9 strict
- Tailwind CSS 4, shadcn/ui
- Supabase (Postgres, Auth, RLS) via `@supabase/ssr`
- Zod 4 for all input validation (client and server)
- Vitest (unit), Playwright (e2e)
- npm (pnpm not installed on the dev machine); deploy on Vercel project `acan` (team `team_vd8DpXZ2KS2pM68LWh6n9tyC`) — never create another
- Repo: https://github.com/Lubama04/acan

## Conventions

- Code, comments, technical docs: English. Site content: French (structure ready for `ar` RTL and `en`).
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`…). Work on `feat/v1`, open a PR, never merge to `main` without the owner's approval.
- Server Components by default; `"use client"` only where interaction requires it.
- Mutations through Server Actions or Route Handlers that validate with Zod, check a honeypot and rate-limit.
- The Supabase service-role key is server-only (`import "server-only"`), never `NEXT_PUBLIC_*`.
- Images through `next/image` (AVIF/WebP). No autoplay video. Keep pages light (slow connections).
- Accessibility WCAG AA; reserve dimensions for any async block (no layout shift).

## Secrets

- No secret in code or Git. `.env.local` is ignored; values live in Vercel env vars. `.env.example` lists every variable.

## Database

- Migrations in `supabase/migrations`, RLS enabled on every table.
- No data deletion and no destructive migration without the owner's explicit approval.
- Run Supabase security advisors after each DDL change and fix the findings.

## Content rules (non-negotiable)

- No fake clients, testimonials, figures, certifications or references. Missing content is listed in
  `docs/a-completer.md` and its section is hidden behind a feature flag until real data exists.
- Never claim the company is registered, never mention any HAMA authorisation. Legal notices read
  RCCM/NIF/address from `site_settings`, showing « en cours d'immatriculation » while empty.
- Agency content only (advice, case studies, agency and client news, resources). No general news,
  no partisan politics. Any partner or paid content is labelled « Contenu sponsorisé ».
- Prices are never invented: show « Sur devis » and the monthly package structure (DB-editable).
- Brand name is « Africa Média » — never « Africa News Media » / « News ».

## Ads

- `AdSlot` priority: direct sponsor → Google AdSense (only if env ID set AND consent given, Consent Mode v2,
  non-personalised by default) → house ad. No ads on legal pages, `/admin`, or quote forms.
- No AdSense ID hard-coded; `/ads.txt` generated from config.

## Commands

- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:e2e`
