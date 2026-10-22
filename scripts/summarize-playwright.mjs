// Reads test-results/results.json (Playwright JSON reporter) and writes docs/playwright-summary.json for FACTS.
import { readFileSync, writeFileSync } from "node:fs";
const r = JSON.parse(readFileSync("test-results/results.json", "utf8"));
let passed = 0, failed = 0, skipped = 0;
(function walk(s) { for (const x of s.suites ?? []) walk(x); for (const sp of s.specs ?? []) for (const t of sp.tests) { const st = t.results.at(-1)?.status; if (t.status === "skipped" || st === "skipped") skipped++; else if (st === "passed") passed++; else failed++; } })({ suites: r.suites });
const out = { passed, failed, skipped, at: new Date().toISOString(), note: "layout matrix (9 viewports x 14 routes), flows on a seeded local chain, demo, landing; mainnet smoke run separately" };
writeFileSync("docs/playwright-summary.json", JSON.stringify(out, null, 1) + "\n");
console.log(out);