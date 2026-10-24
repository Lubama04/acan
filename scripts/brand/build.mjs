// Generates the Africa Média logo options, the retained logo set, favicons, app icons and the OG image.
// Text is converted to vector outlines (opentype.js) so the SVGs render identically everywhere.
// Usage: node scripts/brand/build.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import opentype from "opentype.js";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../..");
const out = (p) => path.join(root, p);

// Colours sampled from the original artwork (Image/Favicon.png, Image/Logo.png).
export const C = {
  navy: "#04234D",
  blue: "#0753A6",
  gold: "#C48C1E",
  white: "#FFFFFF",
};

const fontFile = (w) =>
  require.resolve(`@fontsource/archivo/files/archivo-latin-${w}-normal.woff`);
const loadFont = (w) => opentype.parse(readFileSync(fontFile(w)).buffer);
const F800 = loadFont(800);
const F600 = loadFont(600);

/** Text outline as a path `d` string, left-aligned at (x, baseline y). Returns { d, width }. */
function textPath(font, text, x, y, size, letterSpacing = 0) {
  let cursor = x;
  const parts = [];
  const glyphs = font.stringToGlyphs(text);
  glyphs.forEach((g, i) => {
    parts.push(g.getPath(cursor, y, size).toPathData(2));
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) : 0;
    cursor += ((g.advanceWidth + kern) / font.unitsPerEm) * size + letterSpacing;
  });
  return { d: parts.join(" "), width: cursor - x - letterSpacing };
}

// --- Africa silhouette (hand-traced, 100×100 box), smoothed with Catmull-Rom splines ---
const AFRICA = [
  [31, 6], [40, 4], [47, 6], [52, 3], [56, 8], [62, 10], [70, 8], [73, 12], [78, 22], [83, 30], [90, 33],
  [97, 32], [93, 40], [86, 48], [80, 55], [78, 64], [73, 70], [70, 78], [64, 86], [57, 93], [51, 94],
  [47, 88], [45, 80], [43, 70], [41, 60], [38, 52], [34, 47], [28, 46], [21, 45], [14, 42], [8, 37],
  [4, 31], [4, 24], [9, 17], [16, 12], [24, 8],
];
const MADAGASCAR = [[86, 64], [89, 62], [90, 68], [87, 77], [84, 76], [84, 69]];

function smoothClosed(points, tx, ty, s) {
  const p = points.map(([x, y]) => [tx + x * s, ty + y * s]);
  const n = p.length;
  const f = (v) => v.toFixed(2);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + " Z";
}
const africa = (tx, ty, s) => smoothClosed(AFRICA, tx, ty, s) + " " + smoothClosed(MADAGASCAR, tx, ty, s);

function arc(cx, cy, r, a0, a1) {
  const rad = (a) => (a * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1));
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// --- Option A: speech bubble carrying Africa, with two "signal" arcs (retained) -----------------
// 64×64 icon grid. The bubble tail points down-left: the agency speaks for its clients.
const BUBBLE_A =
  "M14 10 H36 A12 12 0 0 1 48 22 V40 A12 12 0 0 1 36 52 H17 L7 61 L9.5 51 A12 12 0 0 1 2 40 V22 A12 12 0 0 1 14 10 Z";
const AFRICA_A = africa(8, 14, 0.34);
const ARCS_A = [arc(44, 20, 9, -78, -12), arc(44, 20, 16, -78, -12)];

function iconA({ bubble = C.navy, mark = C.white, signal = C.gold, knockout = false } = {}) {
  const arcs = ARCS_A.map(
    (d) => `<path d="${d}" fill="none" stroke="${signal}" stroke-width="4.2" stroke-linecap="round"/>`,
  ).join("");
  if (knockout) {
    return `<path d="${BUBBLE_A} ${AFRICA_A}" fill="${bubble}" fill-rule="evenodd"/>${arcs}`;
  }
  return `<path d="${BUBBLE_A}" fill="${bubble}"/><path d="${AFRICA_A}" fill="${mark}"/>${arcs}`;
}

// --- Option B: "AM" monogram in a rounded square with a signal arc --------------------------------
function iconB({ bg = C.navy, mark = C.white, signal = C.gold, accent = C.blue } = {}) {
  const a = textPath(F800, "A", 0, 0, 34);
  const m = textPath(F800, "M", 0, 0, 34);
  const total = a.width + m.width - 2;
  const x0 = 32 - total / 2;
  const A = textPath(F800, "A", x0, 45, 34);
  const M = textPath(F800, "M", x0 + a.width - 2, 45, 34);
  return (
    `<rect x="2" y="2" width="60" height="60" rx="14" fill="${bg}"/>` +
    `<path d="${A.d}" fill="${mark}"/><path d="${M.d}" fill="${accent === C.blue ? "#8DB8EA" : mark}"/>` +
    `<path d="${arc(52, 14, 6, 180, 270)}" fill="none" stroke="${signal}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="${arc(52, 14, 11, 180, 270)}" fill="none" stroke="${signal}" stroke-width="3.2" stroke-linecap="round"/>`
  );
}

// --- Wordmark -----------------------------------------------------------------------------------------
function wordmark(
  x,
  y,
  { primary = C.navy, secondary = C.blue, tagline = "#8A5F0F", size = 40, center = false } = {},
) {
  const nameW =
    textPath(F800, "Africa", 0, 0, size, -0.4).width + size * 0.22 + textPath(F600, "Média", 0, 0, size, -0.2).width;
  const tagArgs = ["AGENCE DE COMMUNICATION", size * 0.27, size * 0.06];
  const tagW = textPath(F600, tagArgs[0], 0, 0, tagArgs[1], tagArgs[2]).width;
  const width = Math.max(nameW, tagW);
  const nx = center ? x + (width - nameW) / 2 : x;
  const tx = center ? x + (width - tagW) / 2 : x + 1;
  const w1 = textPath(F800, "Africa", nx, y, size, -0.4);
  const w2 = textPath(F600, "Média", nx + w1.width + size * 0.22, y, size, -0.2);
  const tag = textPath(F600, tagArgs[0], tx, y + size * 0.62, tagArgs[1], tagArgs[2]);
  return {
    svg: `<path d="${w1.d}" fill="${primary}"/><path d="${w2.d}" fill="${secondary}"/><path d="${tag.d}" fill="${tagline}"/>`,
    width,
  };
}

const svgDoc = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

function horizontal(icon, colors, scale = 1.25) {
  const iconSize = 64 * scale;
  const wm = wordmark(iconSize + 18, 50, colors);
  const w = Math.ceil(iconSize + 18 + wm.width + 4);
  return svgDoc(w, 80, `<g transform="scale(${scale})">${icon}</g>${wm.svg}`, "Africa Média, agence de communication");
}

function vertical(icon, colors) {
  const wmProbe = wordmark(0, 0, { ...colors, center: true });
  const w = Math.ceil(Math.max(wmProbe.width, 96) + 8);
  const wm = wordmark((w - wmProbe.width) / 2, 140, { ...colors, center: true });
  return svgDoc(w, 172, `<g transform="translate(${(w - 96) / 2} 0) scale(1.5)">${icon}</g>${wm.svg}`, "Africa Média, agence de communication");
}

function write(rel, content) {
  mkdirSync(path.dirname(out(rel)), { recursive: true });
  writeFileSync(out(rel), content);
}

// ICO container holding PNG images (supported by all current browsers and Windows Vista+).
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

const png = (svg, w, h = w) => sharp(Buffer.from(svg), { density: 300 }).resize(w, h).png().toBuffer();

async function main() {
  const brand = { primary: C.navy, secondary: C.blue };

  // Options (for the record)
  write("design/logo-options/option-a-bulle-afrique.svg", horizontal(iconA(), brand));
  write("design/logo-options/option-a-icon.svg", svgDoc(64, 64, iconA(), "Option A"));
  write("design/logo-options/option-b-monogramme-am.svg", horizontal(iconB(), brand));
  write("design/logo-options/option-b-icon.svg", svgDoc(64, 64, iconB(), "Option B"));

  // Retained set: option A
  const white = { primary: C.white, secondary: C.white, tagline: "#E9C46A" };
  const mono = { primary: C.navy, secondary: C.navy, tagline: C.navy };
  write("design/logo/africa-media-horizontal.svg", horizontal(iconA(), brand));
  write("design/logo/africa-media-vertical.svg", vertical(iconA(), brand));
  write("design/logo/africa-media-icon.svg", svgDoc(64, 64, iconA(), "Africa Média"));
  write(
    "design/logo/africa-media-mono.svg",
    horizontal(iconA({ bubble: C.navy, signal: C.navy, knockout: true }), mono),
  );
  write(
    "design/logo/africa-media-white.svg",
    horizontal(iconA({ bubble: C.white, signal: "#E9C46A", knockout: true }), white),
  );

  // Site assets
  write("public/brand/logo-horizontal.svg", horizontal(iconA(), brand));
  write("public/brand/logo-white.svg", horizontal(iconA({ bubble: C.white, signal: "#E9C46A", knockout: true }), white));
  // Small sizes: arcs blur below 32 px, so the favicon keeps only the enlarged bubble and Africa.
  const faviconSvg = svgDoc(
    64,
    64,
    `<g transform="translate(3.25 -9.5) scale(1.15)"><path d="${BUBBLE_A}" fill="${C.navy}"/><path d="${AFRICA_A}" fill="${C.white}"/></g>`,
    "Africa Média",
  );
  write("public/favicon.svg", faviconSvg);
  write("src/app/icon.svg", faviconSvg);

  const sizes = [16, 32, 48];
  const icoPngs = await Promise.all(sizes.map(async (s) => ({ size: s, buf: await png(faviconSvg, s) })));
  write("src/app/favicon.ico", ico(icoPngs));

  // Apple touch icon / PWA icons: icon on a white tile with padding.
  const tile = (bg, pad) =>
    svgDoc(64, 64, `<rect width="64" height="64" fill="${bg}"/><g transform="translate(${pad} ${pad}) scale(${(64 - 2 * pad) / 64})">${iconA()}</g>`, "Africa Média");
  write("public/apple-touch-icon.png", await png(tile("#FFFFFF", 6), 180));
  write("public/icon-192.png", await png(tile("#FFFFFF", 4), 192));
  write("public/icon-512.png", await png(tile("#FFFFFF", 4), 512));
  // Maskable: keep the mark inside the 80% safe zone.
  write("public/icon-maskable-512.png", await png(tile("#FFFFFF", 11), 512));

  write(
    "public/site.webmanifest",
    JSON.stringify(
      {
        name: "Africa Média — Agence de communication",
        short_name: "Africa Média",
        lang: "fr",
        start_url: "/",
        display: "standalone",
        background_color: "#FFFFFF",
        theme_color: C.navy,
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      null,
      2,
    ) + "\n",
  );

  // OG image 1200×630: navy background, white logo, one factual line.
  const line = textPath(F600, "Communication institutionnelle, contenus et relations presse au Tchad", 0, 0, 29);
  const ogBody =
    `<rect width="1200" height="630" fill="${C.navy}"/>` +
    `<rect x="0" y="606" width="1200" height="24" fill="${C.gold}"/>` +
    `<g transform="translate(96 96) scale(2.4)">${iconA({ bubble: C.white, signal: "#E9C46A", knockout: true })}</g>` +
    `<g transform="translate(96 390)">${wordmark(0, 0, { ...white, size: 96 }).svg}</g>` +
    `<g transform="translate(98 530)"><path d="${line.d}" fill="#C9D6EA"/></g>`;
  const og = svgDoc(1200, 630, ogBody, "Africa Média");
  write("design/og-image.svg", og);
  write("src/app/opengraph-image.png", await sharp(Buffer.from(og)).png().toBuffer());
  write("src/app/twitter-image.png", await sharp(Buffer.from(og)).png().toBuffer());

  // Contact sheet for review (not shipped).
  const sheet = svgDoc(
    900,
    560,
    `<rect width="900" height="560" fill="#F4F6FA"/>` +
      `<g transform="translate(30 30)">${iconA()}</g><g transform="translate(110 30)">${iconB()}</g>` +
      `<g transform="translate(200 30) scale(0.25)">${iconA()}</g><g transform="translate(230 30) scale(0.5)">${iconA()}</g>` +
      `<g transform="translate(30 120)">${horizontal(iconA(), brand).replace(/^<svg[^>]*>|<\/svg>\n$/g, "")}</g>` +
      `<g transform="translate(30 220)">${horizontal(iconB(), brand).replace(/^<svg[^>]*>|<\/svg>\n$/g, "")}</g>` +
      `<rect x="0" y="320" width="900" height="240" fill="${C.navy}"/>` +
      `<g transform="translate(30 350)">${horizontal(iconA({ bubble: C.white, signal: "#E9C46A", knockout: true }), white).replace(/^<svg[^>]*>|<\/svg>\n$/g, "")}</g>`,
    "sheet",
  );
  writeFileSync(path.join(process.env.TMP ?? root, "brand-sheet.png"), await sharp(Buffer.from(sheet)).png().toBuffer());
  for (const s of [16, 32]) {
    writeFileSync(path.join(process.env.TMP ?? root, `fav-${s}.png`), await png(faviconSvg, s));
  }
  console.log("Brand assets generated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
