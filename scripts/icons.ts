/**
 * Renders the app icons: a "T+" monogram (DM Serif Display, the + in the accent
 * colour) on the app background.
 *
 *   npm run icons
 *
 * Writes public/icon-192.png, icon-512.png, icon-maskable.png (512) and
 * apple-touch-icon.png (180). Fonts come only from scripts/og/fonts, as for the
 * share card. The monogram is centred on its own glyph box, not the text
 * baseline. Fails (exit 1) if the maskable icon's glyphs leave the safe zone
 * (the circle of radius 40% of the icon, which keeps them inside the central 80%).
 */

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');
const FONTS = [resolve(ROOT, 'scripts/og/fonts/DMSerifDisplay-Regular.ttf')];
const font = { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'DM Serif Display' };

// The tp-bg, body text and tp-accent values in src/index.css (as in the share card).
const BG = '#0a0a0f';
const TEXT = '#f0f0f8';
const ACCENT = '#7c6dfa';

interface Icon {
  file: string;
  size: number;
  /** Glyph box width as a share of the icon width. */
  glyphWidth: number;
  /** Maskable: every glyph pixel must sit inside the 40%-radius circle. */
  maskable?: boolean;
}

const ICONS: Icon[] = [
  { file: 'icon-192.png', size: 192, glyphWidth: 0.62 },
  { file: 'icon-512.png', size: 512, glyphWidth: 0.62 },
  { file: 'icon-maskable.png', size: 512, glyphWidth: 0.5, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, glyphWidth: 0.6 },
];

const REF = 1000; // layout canvas; the glyph box is measured here, then scaled

function monogram(fontSize: number, x: number, y: number): string {
  return `<text x="${x}" y="${y}" font-family="DM Serif Display" font-size="${fontSize}" fill="${TEXT}">T<tspan fill="${ACCENT}">+</tspan></text>`;
}

// Measure the glyph box once at a reference size.
const measured = new Resvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${REF}" height="${REF}">${monogram(REF / 2, 0, REF / 2)}</svg>`,
  { font },
).getBBox();
if (!measured) throw new Error('monogram rendered nothing (fonts missing?)');

const problems: string[] = [];

for (const icon of ICONS) {
  const s = icon.size;
  const scale = (icon.glyphWidth * s) / measured.width;
  const fontSize = (REF / 2) * scale;
  // Place the measured box's centre at the icon's centre.
  const x = s / 2 - (measured.x + measured.width / 2) * scale;
  const y = s / 2 - (measured.y + measured.height / 2 - REF / 2) * scale;
  const text = monogram(fontSize, x, y);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect width="${s}" height="${s}" fill="${BG}"/>${text}</svg>`;

  const box = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${text}</svg>`, { font }).getBBox();
  if (!box) throw new Error(`${icon.file}: nothing rendered`);
  const c = s / 2;
  const corners = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]];
  const reach = Math.max(...corners.map(([px, py]) => Math.hypot(px - c, py - c)));
  console.log(`${icon.file}: ${s}x${s}, glyphs x ${box.x.toFixed(1)}..${(box.x + box.width).toFixed(1)}, y ${box.y.toFixed(1)}..${(box.y + box.height).toFixed(1)}, furthest corner ${(reach / s * 100).toFixed(1)}% of width from centre`);
  if (icon.maskable && reach > 0.4 * s) problems.push(`${icon.file}: glyph box reaches ${(reach / s * 100).toFixed(1)}% from centre, over the 40% safe radius`);

  const png = new Resvg(svg, { font, fitTo: { mode: 'original' } }).render();
  if (png.width !== s || png.height !== s) problems.push(`${icon.file}: rendered ${png.width}x${png.height}`);
  writeFileSync(resolve(ROOT, 'public', icon.file), png.asPng());
}

if (problems.length) {
  for (const p of problems) console.error(`FAIL: ${p}`);
  process.exit(1);
}
console.log(`wrote ${ICONS.length} icons to public/`);
