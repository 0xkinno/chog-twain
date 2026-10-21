// Dev helper: node scripts/shot.mjs <route> [width] [height] [out]   (full page screenshot with Playwright Chromium)
import { chromium } from "@playwright/test";
const [route = "/", w = "1440", h = "900", out = "reference/shot.png"] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 200)));
p.on("pageerror", (e) => errs.push("PAGEERROR " + e.message.slice(0, 200)));
await p.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
await p.waitForTimeout(1500);
if (process.env.SCROLL === "1") { const H = await p.evaluate(() => document.body.scrollHeight); for (let y = 0; y < H; y += 500) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(250); } await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800); }
await p.screenshot({ path: out, fullPage: process.env.FULL === "1" });
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
