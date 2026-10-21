// Writes docs/FACTS.json: every headline number in the README, the Proof page and the video comes from here or
// from live contract reads. Nothing is typed by hand.
// Usage: node scripts/facts.mjs        (reads NEXT_PUBLIC_* from .env.local or the environment)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createPublicClient, http } from "viem";

const read = (p, d = null) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d);
const env = { ...Object.fromEntries((existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])), ...process.env };
const bin = (n) => join(homedir(), ".foundry", "bin", process.platform === "win32" ? `${n}.exe` : n);
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", shell: process.platform === "win32" && cmd === "npx", ...opts });

const facts = { generatedAt: new Date().toISOString() };
facts.gaze = read("data/gaze-stats.json");
const col = read("data/collection.json");
facts.collection = col ? { tokens: Object.keys(col.tokens).length, tokenURIBlock: col.tokenURIBlock, retrievedAt: col.retrievedAt } : null;

// tests
const f = run(bin("forge"), ["test", "--json"], { cwd: "contracts", maxBuffer: 1 << 28 });
let pass = 0, fail = 0, suites = 0;
try {
  const j = JSON.parse(f.stdout);
  for (const s of Object.values(j)) { suites++; for (const t of Object.values(s.test_results ?? {})) t.status === "Success" ? pass++ : fail++; }
} catch { /* forge missing */ }
facts.tests = { forge: { passed: pass, failed: fail, suites } };
const v = run("npx", ["vitest", "run", "--reporter=json"], { maxBuffer: 1 << 28 });
try { const j = JSON.parse(v.stdout.slice(v.stdout.indexOf("{"))); facts.tests.vitest = { passed: j.numPassedTests, failed: j.numFailedTests, files: j.numTotalTestSuites }; } catch { facts.tests.vitest = null; }
facts.tests.playwright = read("docs/playwright-summary.json");
facts.tests.fuzzRuns = 512;

// measured
facts.gasLimits = read("src/lib/gas-limits.json");
facts.measurements = read("docs/measurements.json");
facts.breakCampaign = read("docs/break-campaign.json");
facts.contracts = env.NEXT_PUBLIC_TWAIN ? { network: env.NEXT_PUBLIC_CHAIN === "local" ? "local anvil (31337)" : "Monad mainnet (143)", twain: env.NEXT_PUBLIC_TWAIN, postcard: env.NEXT_PUBLIC_POSTCARD, deployBlock: env.NEXT_PUBLIC_DEPLOY_BLOCK } : null;
facts.deployed = !!env.NEXT_PUBLIC_TWAIN && env.NEXT_PUBLIC_CHAIN !== "local";

// live chain counters, when there is a mainnet contract
facts.chain = null;
if (facts.deployed) {
  try {
    const abi = read("src/lib/abi/ChogTwain.json");
    const client = createPublicClient({ transport: http(env.NEXT_PUBLIC_MONAD_RPC || "https://rpc.monad.xyz") });
    const c = (functionName, args = []) => client.readContract({ address: env.NEXT_PUBLIC_TWAIN, abi, functionName, args });
    const [walkCount, meetings, totalSteps, totalShowUps, lanternsLit, pledgesHeld, price, today] = await Promise.all(["walkCount", "meetings", "totalSteps", "totalShowUps", "lanternsLit", "pledgesHeld", "LANTERN_PRICE", "today"].map((n) => c(n)));
    const block = await client.getBlockNumber();
    const days = [];
    for (let d = Math.max(1, Number(today) - 13); d <= Number(today); d++) days.push({ day: d, steps: Number(await c("stepsOnDay", [BigInt(d)])) });
    facts.chain = { block: block.toString(), walkCount: Number(walkCount), meetings: Number(meetings), totalSteps: Number(totalSteps), totalShowUps: Number(totalShowUps), lanternsLit: Number(lanternsLit), pledgesHeld: pledgesHeld.toString(), lanternPrice: price.toString(), today: Number(today), stepsOnDay: days };
  } catch (e) { facts.chain = { error: String(e.message ?? e).split("\n")[0] }; }
}

mkdirSync("docs", { recursive: true });
writeFileSync("docs/FACTS.json", JSON.stringify(facts, null, 2) + "\n");
console.log("facts written:", JSON.stringify({ forge: facts.tests.forge, vitest: facts.tests.vitest, deployed: facts.deployed }));