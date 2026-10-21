// Dev helper: node scripts/crop.mjs in.png out.png top height [scaleWidth]
import sharp from "sharp";
const [inp, out, top, h, sw] = process.argv.slice(2);
const m = await sharp(inp).metadata();
let img = sharp(inp).extract({ left: 0, top: +top, width: m.width, height: Math.min(+h, m.height - +top) });
if (sw) img = img.resize({ width: +sw });
await img.toFile(out);
console.log(`${m.width}x${m.height} -> ${out}`);
