// Fills <!-- FACTS:name -->...<!-- /FACTS:name --> blocks in README.md and PROOF.md from docs/FACTS.json.
// CI runs it and fails if the files change (git diff --exit-code), so a number can never drift from the facts.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const F = JSON.parse(readFileSync("docs/FACTS.json", "utf8"));
const n = (x) => (x === undefined || x === null ? "unknown" : Number(x).toLocaleString("en-US"));
const wei = (x) => (x === undefined ? "unknown" : (Number(BigInt(x) / 10n ** 15n) / 1000).toLocaleString("en-US"));
const blocks = {
  "gaze-left": () => n(F.gaze?.left),
  "gaze-right": () => n(F.gaze?.right),
  "gaze-front": () => n(F.gaze?.front),
  "max-walks": () => n(F.gaze?.maxSimultaneousWalks),
  "right-waiting": () => n(F.gaze?.rightAlwaysWaiting),
  "gaze-root": () => `\`${F.gaze?.root}\``,
  "forge-tests": () => `${n(F.tests?.forge?.passed)} passing, ${n(F.tests?.forge?.failed)} failing`,
  "vitest-tests": () => (F.tests?.vitest ? `${n(F.tests.vitest.passed)} passing, ${n(F.tests.vitest.failed)} failing` : "not run"),
  "playwright-tests": () => (F.tests?.playwright ? `${n(F.tests.playwright.passed)} passing, ${n(F.tests.playwright.failed)} failing, ${n(F.tests.playwright.skipped ?? 0)} skipped` : "not run"),
  "fuzz-runs": () => n(F.tests?.fuzzRuns),
  "walks": () => (F.chain && !F.chain.error ? n(F.chain.walkCount) : "no mainnet contract yet"),
  "steps": () => (F.chain && !F.chain.error ? n(F.chain.totalSteps) : "no mainnet contract yet"),
  "meetings": () => (F.chain && !F.chain.error ? n(F.chain.meetings) : "no mainnet contract yet"),
  "lanterns": () => (F.chain && !F.chain.error ? n(F.chain.lanternsLit) : "no mainnet contract yet"),
  "pledged": () => (F.chain && !F.chain.error ? `${wei(F.chain.pledgesHeld)} $CHOG` : "no mainnet contract yet"),
  "facts-time": () => F.generatedAt,
  "facts-block": () => (F.chain && !F.chain.error ? n(F.chain.block) : "n/a"),
  "gas-showup": () => n(F.gasLimits?.showUp),
  "gas-showup-meet": () => n(F.gasLimits?.showUpMeet),
  "gas-open": () => n(F.gasLimits?.open),
  "gas-join": () => n(F.gasLimits?.join),
  "latency-proposed": () => (F.measurements?.latency ? `${F.measurements.latency.proposedMedianMs} ms median (${F.measurements.latency.samples} samples, ${F.measurements.latency.chain})` : "not measured yet"),
  "latency-final": () => (F.measurements?.latency ? `${F.measurements.latency.finalMedianMs} ms median (${F.measurements.latency.samples} samples, ${F.measurements.latency.chain})` : "not measured yet"),
  "break-count": () => n(F.breakCampaign?.length ?? 0),
};
let changed = 0;
for (const file of ["README.md", "PROOF.md"]) {
  if (!existsSync(file)) continue;
  const src = readFileSync(file, "utf8");
  const out = src.replace(/<!-- FACTS:([\w-]+) -->[\s\S]*?<!-- \/FACTS:\1 -->/g, (_, name) => {
    if (!blocks[name]) throw new Error(`${file}: unknown FACTS block "${name}"`);
    return `<!-- FACTS:${name} -->${blocks[name]()}<!-- /FACTS:${name} -->`;
  });
  if (out !== src) { writeFileSync(file, out); changed++; }
}
console.log(`render-readme: ${changed} file(s) updated`);