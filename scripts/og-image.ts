/**
 * Renders the share card (og:image) from scripts/og-image.svg.
 *
 *   npm run og:image
 *
 * Fonts come only from scripts/og/fonts (OFL, see the OFL-*.txt files there);
 * system fonts are off, so the output is the same on every machine.
 * Fails (exit 1) if any text leaves the centred 630x630 square, or if the PNG
 * is over 300 KB.
 */

import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');
const TEMPLATE = resolve(ROOT, 'scripts/og-image.svg');
const OUT = resolve(ROOT, 'public/og/terminalplus-1200x630.png');
const FONTS = [
  resolve(ROOT, 'scripts/og/fonts/DMSerifDisplay-Regular.ttf'),
  resolve(ROOT, 'scripts/og/fonts/DMSans-Medium.ttf'),
];

const WIDTH = 1200;
const HEIGHT = 630;
const SQUARE = { x0: (WIDTH - HEIGHT) / 2, x1: (WIDTH + HEIGHT) / 2 }; // 285..915
const MAX_BYTES = 300 * 1024;

const font = { loadSystemFonts: false, fontFiles: FONTS, defaultFontFamily: 'DM Sans' };

const svg = readFileSync(TEMPLATE, 'utf8');

// Text-only pass: drop the full-bleed background so the bbox is the text's own.
const textOnly = svg.replace(/<g id="bg">[\s\S]*?<\/g>/, '');
if (textOnly === svg) throw new Error('template has no <g id="bg"> group');
const bbox = new Resvg(textOnly, { font }).getBBox();
if (!bbox) throw new Error('text pass rendered nothing (fonts missing?)');

const left = bbox.x;
const right = bbox.x + bbox.width;
const top = bbox.y;
const bottom = bbox.y + bbox.height;
console.log(`text bbox x ${left.toFixed(1)}..${right.toFixed(1)}, y ${top.toFixed(1)}..${bottom.toFixed(1)}`);

const png = new Resvg(svg, { font, fitTo: { mode: 'original' } }).render();
if (png.width !== WIDTH || png.height !== HEIGHT) {
  throw new Error(`rendered ${png.width}x${png.height}, expected ${WIDTH}x${HEIGHT}`);
}
const bytes = png.asPng();

const problems: string[] = [];
if (left < SQUARE.x0 || right > SQUARE.x1) {
  problems.push(`text spans x ${left.toFixed(1)}..${right.toFixed(1)}, outside the square ${SQUARE.x0}..${SQUARE.x1}`);
}
if (top < 0 || bottom > HEIGHT) problems.push(`text spans y ${top.toFixed(1)}..${bottom.toFixed(1)}, outside 0..${HEIGHT}`);
if (bytes.length > MAX_BYTES) problems.push(`PNG is ${bytes.length} bytes, over ${MAX_BYTES}`);
if (problems.length) {
  for (const p of problems) console.error(`FAIL: ${p}`);
  process.exit(1);
}

writeFileSync(OUT, bytes);
console.log(`wrote ${OUT} (${WIDTH}x${HEIGHT}, ${bytes.length} bytes)`);
