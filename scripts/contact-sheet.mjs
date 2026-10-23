// Builds reference/demo_video/frames/contact-sheet.jpg from the t###s.jpg frames (one frame per 10 s, labelled), so an agent
// can see the whole video at a glance. Usage: node scripts/contact-sheet.mjs
import sharp from "sharp";
import { readdirSync } from "node:fs";

const dir = "reference/demo_video/frames/";
const fl = readdirSync(dir).filter((f) => /^t\d+s\.jpg$/.test(f)).sort();
const W = 320, H = 180, C = 5;
const comps = [];
for (let i = 0; i < fl.length; i++) {
  const x = (i % C) * W, y = Math.floor(i / C) * H;
  comps.push({ input: await sharp(dir + fl[i]).resize(W, H).jpeg().toBuffer(), left: x, top: y });
  const label = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="22"><rect width="64" height="22" fill="#000" opacity=".7"/><text x="5" y="16" font-size="15" fill="#fff" font-family="Arial">${Number(fl[i].slice(1, 4))}s</text></svg>`;
  comps.push({ input: Buffer.from(label), left: x, top: y });
}
await sharp({ create: { width: C * W, height: Math.ceil(fl.length / C) * H, channels: 3, background: "#fff" } }).composite(comps).jpeg({ quality: 80 }).toFile(dir + "contact-sheet.jpg");
console.log(`${fl.length} frames`);
