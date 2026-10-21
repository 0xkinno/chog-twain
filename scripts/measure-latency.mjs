// D7 and latency on MAINNET with cheer() from the fan wallet C (cheap, repeatable):
//   D7: one call with the wallet default gas estimate vs one with our tight limit: what each really cost in MON
//       (Monad charges gas_limit x price, not gas used).
//   20 samples of "proposed" (receipt) and "finalized" latency in ms.
// Usage: node scripts/measure-latency.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { send, pc, who, abi, TWAIN, limits } from "./lib/mainnet.mjs";

const st = JSON.parse(readFileSync("docs/mainnet-state.json", "utf8"));
const g = BigInt(st.walk1);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const price = await pc.getGasPrice();

// D7: default estimate vs tight limit
const est = await pc.estimateContractGas({ account: who.C.account, address: TWAIN, abi, functionName: "cheer", args: [g] });
const dflt = await send("C", { functionName: "cheer", args: [g], gas: est * 2n, label: "D7: cheer with a generous wallet-style limit (2x estimate)" });
const tight = await send("C", { functionName: "cheer", args: [g], gas: BigInt(limits.cheer), label: "D7: cheer with our tight limit from gas-limits.json" });
const samples = [];
for (let i = 0; i < 20; i++) { const r = await send("C", { functionName: "cheer", args: [g], gas: BigInt(limits.cheer) }); samples.push(r); process.stdout.write("."); }
console.log();
const prop = samples.map((s) => s.proposedMs), fin = samples.filter((s) => s.finalMs).map((s) => s.finalMs);
const m = existsSync("docs/measurements.json") ? JSON.parse(readFileSync("docs/measurements.json", "utf8")) : {};
m.latency = { chain: "Monad mainnet", samples: samples.length, proposedMedianMs: median(prop), finalMedianMs: median(fin), proposedMs: prop, finalMs: fin, fn: "cheer" };
m.d7 = {
  chain: "Monad mainnet", gasPriceWei: price.toString(), estimate: Number(est),
  generousLimit: { gasLimit: Number(est * 2n), gasUsed: dflt.gasUsed, feeMon: dflt.feeMon },
  tightLimit: { gasLimit: limits.cheer, gasUsed: tight.gasUsed, feeMon: tight.feeMon },
  note: "Monad charges gas_limit x price, so the fee follows the limit, not gasUsed.",
};
writeFileSync("docs/measurements.json", JSON.stringify(m, null, 1) + "\n");
console.log("D7", JSON.stringify(m.d7));
console.log("latency proposed median", m.latency.proposedMedianMs, "ms, final median", m.latency.finalMedianMs, "ms");