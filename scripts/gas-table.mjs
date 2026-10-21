// Measures gasUsed for every user-facing function, 20+ calls each with two wallets, on the local chain
// (scripts/local-chain.mjs must be running), then writes src/lib/gas-limits.json:
//   limit = ceil(max(gasUsed) * 1.25 / 1000) * 1000  per function.
// showUpMeet is measured separately: the show-up that lands the meeting mints two postcards and writes both Friend Books.
// Monad charges gas_limit x price, not gas used, so a tight explicit limit saves real money (see D7 in DISCOVERY.md).
// Usage: node scripts/gas-table.mjs
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { lists, makeApi, warpDays, abi, erc20 } from "./lib/local.mjs";

const api = makeApi();
const { L, R, proofs } = lists();
const NOTE = "0x" + Buffer.from("gm").toString("hex").padEnd(56, "0");
const E18 = 10n ** 18n;
const N = 20;
const max = {};
const samples = {};
const rec = (k, rc) => {
  (samples[k] ??= []).push(Number(rc.gasUsed));
  max[k] = Math.max(max[k] ?? 0, Number(rc.gasUsed));
};
let li = 300;
let ri = 300;
const pair = () => [L[li++], R[ri++]];
const count = async () => Number(await api.pc.readContract({ address: api.TWAIN, abi, functionName: "walkCount" }));
const openRaw = async (i, chog, dist, pledge) => {
  const p = proofs[chog];
  if (pledge) await api.approve(i, pledge);
  const rc = await api.send(i, "open", [BigInt(chog), p.side, p.proof, dist, pledge, api.ZERO]);
  return { rc, id: await count() };
};
const joinRaw = async (i, id, chog, pledge) => {
  const p = proofs[chog];
  if (pledge) await api.approve(i, pledge);
  return api.send(i, "join", [BigInt(id), BigInt(chog), p.side, p.proof]);
};

for (let i = 0; i < N; i++) {
  const [a, b] = pair();
  const pledge = i % 2 ? 700n * E18 : 0n; // half of the walks carry a pledge
  const o = await openRaw(1, a, 7, pledge);
  rec("open", o.rc);
  rec("join", await joinRaw(2, o.id, b, pledge));
  rec("showUp", await api.send(1, "showUp", [BigInt(o.id), NOTE])); // second arrival: takes the step
  rec("cheer", await api.send(3, "cheer", [BigInt(o.id)]));
  await api.approve(3, 100n * E18);
  rec("light", await api.send(3, "light", [BigInt(o.id)]));
  rec("setHome", await api.send(9, "setHome", [BigInt((i % 24) + 1), i % 2 === 0]));
  rec("leave", await api.send(i % 2 ? 2 : 1, "leave", [BigInt(o.id)]));
}
// cancel and claim: the opener cancels an open walk that holds a pledge
for (let i = 0; i < N; i++) {
  const [a] = pair();
  const o = await openRaw(1, a, 14, 150n * E18);
  rec("cancel", await api.send(1, "cancel", [BigInt(o.id)]));
  rec("claim", await api.send(1, "claim", []));
}
// poke: a stale walk closed by anyone
for (let i = 0; i < N; i++) {
  const [a, b] = pair();
  const o = await openRaw(1, a, 7, 0n);
  await joinRaw(2, o.id, b, 0n);
  await warpDays(1);
  rec("poke", await api.send(3, "poke", [BigInt(o.id)]));
}
// showUpMeet: the show-up that lands the meeting
for (let i = 0; i < N; i++) {
  const [a, b] = pair();
  const o = await openRaw(1, a, 7, 0n);
  await joinRaw(2, o.id, b, 0n);
  await api.send(1, "showUp", [BigInt(o.id), NOTE]);
  for (let d = 1; d < 6; d++) {
    await warpDays(1);
    await api.send(1, "showUp", [BigInt(o.id), NOTE]);
    await api.send(2, "showUp", [BigInt(o.id), NOTE]);
  }
  await warpDays(1);
  await api.send(1, "showUp", [BigInt(o.id), NOTE]);
  rec("showUpMeet", await api.send(2, "showUp", [BigInt(o.id), NOTE]));
}
for (let i = 0; i < N; i++) {
  const hash = await api.wcs[1].writeContract({ address: api.TOKEN, abi: erc20, functionName: "approve", args: [api.TWAIN, BigInt(i + 1) * E18] });
  rec("approve", await api.pc.waitForTransactionReceipt({ hash }));
}

const lim = {};
for (const [k, v] of Object.entries(max)) lim[k] = Math.ceil((v * 1.25) / 1000) * 1000;
const out = { ...lim, measured: `local anvil (EVM gas does not depend on the chain), ${N} calls per function, two wallets, ${new Date().toISOString()}` };
writeFileSync("src/lib/gas-limits.json", JSON.stringify(out, null, 1) + "\n");
mkdirSync("docs", { recursive: true });
const table = Object.keys(max).sort().map((k) => ({ fn: k, calls: samples[k].length, minGas: Math.min(...samples[k]), maxGas: max[k], limit: lim[k] }));
const m = existsSync("docs/measurements.json") ? JSON.parse(readFileSync("docs/measurements.json", "utf8")) : {};
m.gas = { chain: "local anvil", at: new Date().toISOString(), table };
writeFileSync("docs/measurements.json", JSON.stringify(m, null, 1) + "\n");
console.table(table);
