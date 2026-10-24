# Africa Média — website

Website of « Agence de Communication Africa Média » (communication agency, Chad).
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase · Zod · Vercel.

Project rules and conventions: see [`CLAUDE.md`](CLAUDE.md).

## Requirements

- Node.js 22+
- npm 10+
- Supabase CLI (optional, for migrations): https://supabase.com/docs/guides/local-development

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

## Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Supabase publishable key (RLS applies) |
| `SUPABASE_SECRET_KEY` | **server only** | Supabase secret key (bypasses RLS) — never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | WhatsApp Business number, digits only (e.g. `235XXXXXXXX`) |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | public | `ca-pub-…`; empty disables AdSense |
| `RATE_LIMIT_SALT` | server only | Random secret used to hash IPs |

Values for preview and production are set in the Vercel project `acan`, never committed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route type generation + `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright; run `npx playwright install` once) |
| `npm run format` | Prettier |

## Database

Migrations live in `supabase/migrations` and are applied to the Supabase project `acan`
(`qkzacuaqeracjluhusmr`, eu-west-3). RLS is enabled on every table.

## Deployment

The GitHub repository is connected to the Vercel project `acan`. Every pull request gets a preview
deployment; `main` deploys to production. Merges to `main` require the owner's approval.
