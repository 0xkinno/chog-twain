// Dev helper: node scripts/rects.mjs <route> <width> <selector-text>...  prints page-coordinate rects of links/buttons
import { chromium } from "@playwright/test";
const [route, w, ...texts] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 800 } });
await p.goto(`http://localhost:${process.env.PORT ?? 3100}${route}`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const out = await p.evaluate((texts) => [...document.querySelectorAll("a,button")].filter((e) => texts.some((t) => (e.textContent || "").includes(t))).map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName} "${(e.textContent || "").trim().slice(0, 30)}" x=${Math.round(r.left)} y=${Math.round(r.top + scrollY)} w=${Math.round(r.width)} h=${Math.round(r.height)} pos=${getComputedStyle(e).position}`; }), texts);
console.log(out.join("\n"));
console.log("doc height", await p.evaluate(() => document.documentElement.scrollHeight), "footer top", await p.evaluate(() => Math.round(document.querySelector("footer").getBoundingClientRect().top + scrollY)));
await b.close();
