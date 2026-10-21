// Dev helper: node scripts/dbg.mjs <route> : prints console errors with stacks, and failed requests
import { chromium } from "@playwright/test";
const route = process.argv[2] ?? "/";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message, "\n", (e.stack || "").split("\n").slice(0, 6).join("\n")));
p.on("console", (m) => m.type() === "error" && console.log("CONSOLE", m.text().slice(0, 300), m.location().url));
p.on("requestfailed", (r) => console.log("REQFAIL", r.url().slice(0, 120), r.failure()?.errorText));
p.on("response", (r) => r.status() >= 400 && console.log("HTTP", r.status(), r.url().slice(0, 120)));
await p.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 120000 }).catch((e) => console.log("goto", e.message));
await p.waitForTimeout(2000);
console.log("title:", await p.title());
await b.close();
