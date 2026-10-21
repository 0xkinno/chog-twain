// One command for the whole end-to-end run against a LOCAL chain (never mainnet):
//   starts anvil + deploys (scripts/local-chain.mjs), seeds every walk state, builds the app pointed at it,
//   serves it, runs Playwright (layout matrix + flows), and tears everything down.
// Usage: node scripts/e2e.mjs [playwright args, e.g. tests/e2e/02-flows.spec.ts]
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";

const sh = process.platform === "win32";
const port = process.env.E2E_PORT ?? "3100";
const procs = [];
const stop = () => procs.forEach((p) => { try { process.platform === "win32" ? spawnSync("taskkill", ["/pid", String(p.pid), "/T", "/F"]) : p.kill(); } catch {} });
process.on("exit", stop);
process.on("SIGINT", () => { stop(); process.exit(130); });

if (existsSync(".env.e2e")) rmSync(".env.e2e");
procs.push(spawn("node", ["scripts/local-chain.mjs"], { stdio: ["ignore", "inherit", "inherit"] }));
for (let i = 0; i < 120 && !(existsSync(".env.e2e") && readFileSync(".env.e2e", "utf8").includes("TWAIN")); i++) await new Promise((r) => setTimeout(r, 1000));
if (!existsSync(".env.e2e")) throw new Error("local chain did not come up");
const e2eEnv = Object.fromEntries(readFileSync(".env.e2e", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const env = { ...process.env, ...e2eEnv, NEXT_PUBLIC_SITE_URL: `http://localhost:${port}` };

let r = spawnSync("node", ["scripts/seed-local.mjs"], { stdio: "inherit" });
if (r.status) process.exit(r.status);
r = spawnSync("npx", ["next", "build"], { stdio: "inherit", env, shell: sh });
if (r.status) process.exit(r.status);
procs.push(spawn("npx", ["next", "start", "-p", port], { stdio: "inherit", env, shell: sh }));
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${port}/`)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 1000)); }
const t = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], { stdio: "inherit", env, shell: sh });
process.exit(t.status ?? 1);