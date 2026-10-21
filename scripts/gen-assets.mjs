// Build-time assets (run by predev and prebuild):
//   src/data/chogs.json      compact table of all 1,969 Chogs for the picker and mosaic (from data/collection.json)
//   public/data/gaze.json    Merkle proofs served as a static file, fetched only when a walk is opened or joined
//   public/paper-grain.png   fine paper grain for the magazine look
//   public/icons             favicon set from public/brand/mark.svg
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import sharp from "sharp";

const col = JSON.parse(readFileSync("data/collection.json", "utf8"));
const gz = JSON.parse(readFileSync("data/gaze.json", "utf8"));
mkdirSync("src/data", { recursive: true });
mkdirSync("public/data", { recursive: true });
mkdirSync("public/icons", { recursive: true });

// [tokenId, artNo, gaze(1 L,2 R,3 F), tier, aura, head, background, eyes, accessory, image CID path]
const rows = [];
let imageBase = null;
for (let id = 1; id <= 1969; id++) {
  const t = col.tokens[id];
  const artNo = Number(/#(\d+)/.exec(t.name)[1]);
  const m = /^ipfs:\/\/([^/]+)\/(.+)$/.exec(t.image);
  imageBase ??= m[1];
  if (m[1] !== imageBase) throw new Error(`token ${id} image is in another folder: ${t.image}`);
  rows.push([id, artNo, gz.proofs[id].side, t.attributes.Tier, t.attributes.Aura ?? "", t.attributes.Head ?? "", t.attributes.Background ?? "", t.attributes.Eyes ?? "", t.attributes.Accessory ?? "", m[2]]);
}
writeFileSync("src/data/chogs.json", JSON.stringify({ imageBase, rows }));
copyFileSync("data/gaze.json", "public/data/gaze.json");

// paper grain: soft monochrome noise, tiled
const size = 256;
const buf = Buffer.alloc(size * size * 4);
let s = 1234567;
for (let i = 0; i < size * size; i++) {
  s = (s * 1664525 + 1013904223) >>> 0;
  const v = 235 + ((s >>> 24) % 20);
  buf[i * 4] = v - 2; buf[i * 4 + 1] = v - 4; buf[i * 4 + 2] = v + 6; buf[i * 4 + 3] = 26;
}
await sharp(buf, { raw: { width: size, height: size, channels: 4 } }).png().toFile("public/paper-grain.png");

if (existsSync("public/brand/mark.svg")) {
  const svg = readFileSync("public/brand/mark.svg");
  for (const [n, px] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180], ["favicon-32.png", 32]]) {
    await sharp(svg, { density: 384 }).resize(px, px).png().toFile(`public/icons/${n}`);
  }
}
console.log(`gen-assets: ${rows.length} chogs, image folder ${imageBase}`);