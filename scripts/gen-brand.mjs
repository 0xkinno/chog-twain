// Builds docs/brand/wordmark.svg with the text converted to outlines (Bagel Fat One), so it renders the same in
// any README or <img> with no font loading. Also writes public/brand/wordmark.svg.
// Usage: node scripts/gen-brand.mjs
import opentype from "opentype.js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const buf = readFileSync("node_modules/@fontsource/bagel-fat-one/files/bagel-fat-one-latin-400-normal.woff");
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const size = 150;
const line = (text, x, y) => font.getPath(text, x, y, size).toPathData(2);
const w1 = font.getAdvanceWidth("Chog", size);
const w2 = font.getAdvanceWidth("Twain", size);
const gap = 120; // room for the two small heads between the words
const W = Math.ceil(w1 + gap + w2 + 80);
const H = 250;
const y = 175;
const d1 = line("Chog", 40, y);
const d2 = line("Twain", 40 + w1 + gap, y);
const cx = 40 + w1 + gap / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Chog Twain wordmark: two Chogs looking at each other">
  <defs><filter id="s" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="0" flood-color="#23164d" flood-opacity=".9"/></filter></defs>
  <g filter="url(#s)">
    <path d="${d1}" fill="#23164d" stroke="#ffffff" stroke-width="14" stroke-linejoin="round" paint-order="stroke fill"/>
    <path d="${d2}" fill="#6c4ab6" stroke="#ffffff" stroke-width="14" stroke-linejoin="round" paint-order="stroke fill"/>
  </g>
  <g transform="translate(${cx - 58} 80) scale(1.08)">
    <path d="M10 60 L6 38 L20 46 L22 28 L34 42 L46 36 Q56 42 56 60 Q56 80 34 80 Q10 80 10 60 Z" fill="#6c4ab6" stroke="#23164d" stroke-width="4" stroke-linejoin="round"/>
    <path d="M24 56 Q24 42 40 42 Q54 44 54 60 Q54 76 38 76 Q24 76 24 56 Z" fill="#f6e9c7" stroke="#23164d" stroke-width="4"/>
    <circle cx="44" cy="56" r="5.5" fill="#23164d"/><circle cx="46" cy="54" r="2" fill="#fff"/>
    <path d="M98 60 L102 38 L88 46 L86 28 L74 42 L62 36 Q52 42 52 60 Q52 80 74 80 Q98 80 98 60 Z" fill="#836ef9" stroke="#23164d" stroke-width="4" stroke-linejoin="round" transform="translate(8 0)"/>
    <path d="M94 56 Q94 42 78 42 Q64 44 64 60 Q64 76 80 76 Q94 76 94 56 Z" fill="#f6e9c7" stroke="#23164d" stroke-width="4" transform="translate(8 0)"/>
    <circle cx="82" cy="56" r="5.5" fill="#23164d" transform="translate(8 0)"/><circle cx="80" cy="54" r="2" fill="#fff" transform="translate(8 0)"/>
  </g>
  <path d="M${cx - 8} 150 Q${cx - 4} 160 ${cx} 150 Q${cx + 4} 160 ${cx + 8} 150" fill="none" stroke="#ff7aa8" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>
</svg>
`;
mkdirSync("docs/brand", { recursive: true });
writeFileSync("docs/brand/wordmark.svg", svg);
writeFileSync("public/brand/wordmark.svg", svg);
console.log(`wordmark ${W}x${H}`);