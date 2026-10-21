// House style gate (Part 1.3, 12.4). Fails on em or en dashes, emoji, hype words in .md .ts .tsx .css files
// outside reference/, node_modules/, contracts/lib/. Locally it also fails on any name in
// reference/BANNED_NAMES.txt (that file is gitignored, so CI skips this part).
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SKIP = new Set(["node_modules", ".git", ".next", "reference", "out", "cache", "lib", "playwright-report", "test-results", ".vercel"]);
const EXT = /\.(md|ts|tsx|css|mjs)$/;
const HYPE = /\b(revolutionary|seamless(ly)?|cutting-edge|world-class|game-changing|paradigm)\b/i;
const DASH = /[\u2013\u2014]/;
const EMOJI = /\p{Extended_Pictographic}/u;
// this file and the build scripts that define the rules may name them
const SELF = new Set(["scripts/check-copy.mjs"]);

const banned = existsSync("reference/BANNED_NAMES.txt")
  ? readFileSync("reference/BANNED_NAMES.txt", "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  : [];
if (!banned.length) console.log("note: reference/BANNED_NAMES.txt not found, banned-name check skipped (expected in CI)");

const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (EXT.test(n)) files.push(p.replace(/\\/g, "/"));
  }
})(".");

let bad = 0;
for (const f of files) {
  if (SELF.has(f)) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    const hit = (why) => {
      console.log(`${f}:${i + 1}: ${why}`);
      bad++;
    };
    if (DASH.test(line)) hit("em or en dash");
    if (EMOJI.test(line)) hit("emoji");
    const h = line.match(HYPE);
    if (h) hit(`hype word "${h[0]}"`);
    for (const b of banned) if (b.length > 3 && line.toLowerCase().includes(b.toLowerCase())) hit(`banned name "${b}"`);
  });
}
console.log(bad ? `check-copy: ${bad} problem(s) in ${files.length} files` : `check-copy: clean (${files.length} files)`);
process.exit(bad ? 1 : 0);