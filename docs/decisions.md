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
