# Africa Média — Design system

Sober, institutional and warm. The site has to reassure a ministry procurement officer and an NGO
communications lead, while staying light enough to load on a 3G connection in N'Djamena.

## 1. Logo

### Options explored (`design/logo-options/`)

| Option | Idea | Kept? |
| --- | --- | --- |
| **A — Bulle Afrique** | Speech bubble carrying the silhouette of Africa, two gold "signal" arcs. | **Yes** |
| B — Monogramme AM | "AM" monogram in a rounded square, gold signal arc. | No |

**Why A.** It keeps the three strongest cues of the original artwork (Africa, the "signal" waves,
the navy/blue/gold palette) and swaps the microphone and quill, which say *newsroom*, for a speech
bubble, which says *we speak for you*: the agency's job. Option B is cleaner but generic. A
two-letter monogram in a rounded square could belong to any company, and "AM" also reads as the
radio band. The word "News" is gone everywhere.

**Small sizes.** Below 32 px the arcs blur, so `favicon.svg` and `favicon.ico` use a simplified mark
(enlarged bubble + Africa, no arcs). Checked at 16 px and 32 px.

### Retained set (`design/logo/`)

| File | Use |
| --- | --- |
| `africa-media-horizontal.svg` | Default: site header, documents |
| `africa-media-vertical.svg` | Square formats, social avatars with text |
| `africa-media-icon.svg` | Icon alone |
| `africa-media-mono.svg` | One colour (navy), stamps, fax, embroidery |
| `africa-media-white.svg` | Reversed, on navy or photos |

All files are real vectors: text is outlined (Archivo), Africa is a hand-traced path. Regenerate with
`node scripts/brand/build.mjs`.

Clear space: at least the height of the bubble's tail (≈ 1/6 of the icon) around the logo.
Minimum size: icon 16 px; horizontal logo 120 px wide.

Don't: recolour the arcs in blue, stretch, add a shadow or gradient, put the colour logo on a photo.

### Derived assets

`public/favicon.svg`, `src/app/favicon.ico` (16/32/48), `src/app/icon.svg`,
`public/apple-touch-icon.png` (180), `public/icon-192.png`, `public/icon-512.png`,
`public/icon-maskable-512.png` (mark inside the 80 % safe zone), `public/site.webmanifest`,
`src/app/opengraph-image.png` and `twitter-image.png` (1200×630).

## 2. Colour

Sampled from the original files (`Image/Favicon.png`, `Image/Logo.png`), averaged over each cluster.

| Token | Hex | Role |
| --- | --- | --- |
| `navy` | `#04234D` | Primary text, headers, dark sections |
| `blue` | `#0753A6` | Links, primary buttons, accents |
| `gold` | `#C48C1E` | Decorative only (rules, arcs, icons). **Never text on white** |
| `gold-ink` | `#8A5F0F` | Gold when it has to be text on light backgrounds |
| `gold-light` | `#E9C46A` | Gold text/accents on navy |
| `paper` | `#F6F4EF` | Warm off-white for alternating sections |
| `slate` | `#4A5568` | Secondary text on white |
| `slate-paper` | `#5B6B82` | Secondary text on paper |

### Verified contrast (WCAG 2.2)

| Pair | Ratio | Use allowed |
| --- | --- | --- |
| navy / white | 15.52 | All text |
| blue / white | 7.51 | All text, buttons (white on blue 7.51) |
| gold / white | 2.95 | ✗ text, ✓ decoration ≥ 3:1 not required |
| gold-ink / white | 5.64 | Body text |
| gold-light / navy | 9.29 | All text |
| gold / navy | 5.26 | Text ≥ 14 px |
| slate / white | 7.53 | Body text |
| slate-paper / paper | 4.94 | Body text |

No gradients, no glassmorphism, no purple.

## 3. Typography (2 families)

| Role | Family | Why |
| --- | --- | --- |
| Headings, numbers, buttons | **Archivo** (600–800) | Grotesque with a slightly condensed, poster-like stance; the logo uses it, so the site and the mark speak with one voice. |
| Body, forms | **Source Sans 3** (400, 600) | Very readable at small sizes, complete French diacritics, light files. |

Arabic (future): Noto Sans Arabic, loaded only on `/ar`.

Loaded through `next/font/google` (self-hosted at build, `display: swap`, latin subset only).

Scale (rem, mobile → desktop with `clamp`):

| Token | Size | Line height |
| --- | --- | --- |
| `display` | 2.25 → 3.5 | 1.05 |
| `h1` | 2 → 2.75 | 1.1 |
| `h2` | 1.5 → 2 | 1.15 |
| `h3` | 1.2 → 1.35 | 1.25 |
| `body` | 1.0625 (17 px) | 1.6 |
| `small` | 0.875 | 1.5 |
| `eyebrow` | 0.8125, uppercase, +0.08em | 1.4 |

Line length capped at ~68 characters (`max-w-prose`).

## 4. Space, grid, shape

- 4 px base; section padding `py-16` mobile, `py-24` desktop.
- Container 72 rem max, 16 px side gutter on mobile (`px-4`), 24 px from `sm`.
- Radius: 6 px (inputs, buttons), 10 px (panels). The bubble's 12/64 radius is the only "round" shape.
- Borders 1 px `navy/12 %`. Shadows avoided; when needed, one soft shadow for overlays only.

## 5. Components

| Component | Notes |
| --- | --- |
| Button | Primary: blue bg, white text. Secondary: navy outline. Min target 44×44 px. Visible 3 px gold focus ring. |
| Link | Blue, underline offset 3 px; underline always visible in body text. |
| Section header | Eyebrow (gold-ink) + h2 + one-sentence lede. |
| Service block | Varied layouts by design: a numbered list for services, a table for packages, a two-column split for sectors. No grid of identical cards. |
| Form | Labels above fields, errors in text + `aria-describedby`, never colour alone. |
| Notice | "En cours d'immatriculation" and "Contenu sponsorisé" share one bordered style. |
| AdSlot | Fixed reserved box per placement + "Publicité" label above. |

Icons: `lucide-react` line icons, 1.75 stroke, never emoji.

## 6. Imagery

- No AI-generated images presented as real; no stock faces pretending to be the team or clients.
- Until the agency provides its own photos, pages use typographic compositions: large figures of
  *services*, not fake numbers; the Africa mark; ruled layouts.
- Every image gets real alt text; decorative graphics get `alt=""`.
- Images via `next/image` (AVIF/WebP), lazy by default, no autoplay video.

## 7. Motion and accessibility

- Transitions ≤ 150 ms, opacity/transform only; all disabled under `prefers-reduced-motion`.
- Keyboard: skip link, logical tab order, focus always visible.
- RTL-ready: logical CSS properties (`ps-`, `me-`, `start`/`end`), `dir` set per locale.

## 8. Voice

Plain, concrete French. Short sentences. Say what we do, for whom, and how a project runs.
No "solutions innovantes", no "360°", no invented figures. Prefer *vous* addressed to a decision maker.
