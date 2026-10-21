// Ships the artwork the first screens rely on (hero pair, landing mosaic, demo defaults) inside public/art, as
// 512 px webp. Everything else is served by /api/art from IPFS gateways with a cache. Re-run after changing the set.
// Usage: node scripts/cache-art.mjs
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const chogs = JSON.parse(readFileSync("src/data/chogs.json", "utf8"));
const rows = chogs.rows;
const L = rows.filter((r) => r[2] === 1).filter((_, i) => i % 41 === 0).slice(0, 16);
const R = rows.filter((r) => r[2] === 2).filter((_, i) => i % 60 === 0).slice(0, 22);
const F = rows.filter((r) => r[2] === 3).slice(0, 10);
const ids = new Set([1, 846, 2, 3, 4, 5, 6, 7, 8, ...[...L, ...R, ...F].map((r) => r[0])]);
const GATEWAYS = ["https://ipfs.io/ipfs/", "https://dweb.link/ipfs/", "https://ipfs.filebase.io/ipfs/", "https://gateway.pinata.cloud/ipfs/", "https://4everland.io/ipfs/"];
mkdirSync("public/art", { recursive: true });
let ok = 0, fail = [];
for (const id of ids) {
  const out = `public/art/${id}.webp`;
  if (existsSync(out)) { ok++; continue; }
  const row = rows.find((r) => r[0] === id);
  let buf = null;
  for (let round = 0; round < 3 && !buf; round++) for (const g of GATEWAYS) {
    try { const r = await fetch(`${g}${chogs.imageBase}/${row[9]}`, { signal: AbortSignal.timeout(15000) }); if (r.ok) { buf = Buffer.from(await r.arrayBuffer()); break; } } catch {}
  }
  if (!buf) { fail.push(id); continue; }
  writeFileSync(out, await sharp(buf).resize(512, 512).webp({ quality: 82 }).toBuffer());
  ok++;
}
console.log(`cached ${ok}/${ids.size} images in public/art`, fail.length ? `FAILED: ${fail.join(",")}` : "");