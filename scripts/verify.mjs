// The offline verifier. Prints PASS or FAIL for each check and exits non-zero on any FAIL.
//   1. rebuild the gaze Merkle root from data/collection.json and compare with data/gaze-stats.json AND the contract's GAZE_ROOT
//   2. refetch a sample of metadata from IPFS and compare sha256 with data/collection.json (--ipfs N, default 5)
//   3. for every walk: replay its events through packages/rules (the same engine the Demo uses) and compare with the
//      chain's own preview(id): status, gap, steps, miss streak, lanterns, forfeits
//   4. decode every postcard tokenURI and check it against its walk
// Logs are read in 100-block windows (public Monad RPCs cap eth_getLogs at 100). Use MONAD_LOGS_RPC for a bigger window.
// Usage: node scripts/verify.mjs [--ipfs 20] [--rpc https://rpc.monad.xyz]
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createPublicClient, http, parseAbiItem } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { apply, newWorld, preview } from "../packages/rules/src/engine.ts";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const envFile = existsSync(".env.local") ? Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])) : {};
const env = { ...envFile, ...process.env };
const RPC = arg("rpc", env.MONAD_LOGS_RPC ?? env.NEXT_PUBLIC_MONAD_RPC ?? "https://rpc.monad.xyz");
const TWAIN = env.NEXT_PUBLIC_TWAIN;
const abi = JSON.parse(readFileSync("src/lib/abi/ChogTwain.json", "utf8"));
const pcAbi = JSON.parse(readFileSync("src/lib/abi/TwainPostcard.json", "utf8"));
const pc = createPublicClient({ transport: http(RPC, { retryCount: 4 }) });
let fails = 0;
const report = (ok, what, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${what}${detail ? "  " + detail : ""}`); if (!ok) fails++; };

// 1. gaze root
const col = JSON.parse(readFileSync("data/collection.json", "utf8"));
const values = Object.entries(col.tokens).map(([id, t]) => { const s = t.attributes.Side ?? (t.attributes.Base === "1:1" ? "Front" : undefined); return [id, s === "Left" ? 1 : s === "Right" ? 2 : 3]; });
const root = StandardMerkleTree.of(values, ["uint256", "uint8"]).root;
const stats = JSON.parse(readFileSync("data/gaze-stats.json", "utf8"));
report(root === stats.root, "gaze root rebuilt from data/collection.json equals data/gaze-stats.json", root.slice(0, 18) + "...");
if (TWAIN) { const onchain = await pc.readContract({ address: TWAIN, abi, functionName: "GAZE_ROOT" }); report(onchain === root, "gaze root equals the contract's immutable GAZE_ROOT", onchain.slice(0, 18) + "..."); }
report(values.length === 1969, "collection has 1,969 tokens", `${stats.left} left, ${stats.right} right, ${stats.front} front`);

// 2. metadata sample
const sample = Number(arg("ipfs", 5));
if (sample > 0) {
  let ok = 0; let bad = [];
  const ids = Array.from({ length: sample }, (_, i) => 1 + Math.floor((i * 1969) / sample));
  for (const id of ids) {
    const t = col.tokens[id]; let got = null;
    for (const g of ["https://ipfs.io/ipfs/", "https://dweb.link/ipfs/", "https://ipfs.filebase.io/ipfs/", "https://4everland.io/ipfs/"]) { try { const r = await fetch(g + t.tokenURI.replace("ipfs://", ""), { signal: AbortSignal.timeout(15000) }); if (r.ok) { got = Buffer.from(await r.arrayBuffer()); break; } } catch {} }
    if (got && createHash("sha256").update(got).digest("hex") === t.metadataSha256) ok++; else bad.push(id);
  }
  report(bad.length === 0, `IPFS metadata sha256 matches for ${ok} of ${sample} sampled tokens`, bad.length ? `mismatch or unreachable: ${bad.join(",")}` : "");
}

// 3. walks from events
if (!TWAIN) { console.log("SKIP  no ChogTwain address in this environment: walk and postcard checks skipped"); process.exit(fails ? 1 : 0); }
const head = await pc.getBlockNumber();
const from = BigInt(env.NEXT_PUBLIC_DEPLOY_BLOCK ?? 0);
const epoch = Number(await pc.readContract({ address: TWAIN, abi, functionName: "EPOCH" }));
const walkCount = Number(await pc.readContract({ address: TWAIN, abi, functionName: "walkCount" }));
const WINDOW = 100n;
const windows = []; for (let b = from; b <= head; b += WINDOW) windows.push([b, b + WINDOW - 1n > head ? head : b + WINDOW - 1n]);
console.log(`reading events in ${windows.length} windows of 100 blocks from ${from} to ${head}`);
const logs = []; let next = 0;
async function worker() { while (next < windows.length) { const [a, b] = windows[next++]; for (let t = 0; t < 4; t++) { try { logs.push(...(await pc.getLogs({ address: TWAIN, fromBlock: a, toBlock: b }))); break; } catch (e) { if (t === 3) throw e; await new Promise((r) => setTimeout(r, 400)); } } } }
await Promise.all(Array.from({ length: 8 }, worker));
logs.sort((x, y) => Number(x.blockNumber - y.blockNumber) || x.logIndex - y.logIndex);
const { decodeEventLog } = await import("viem");
const events = logs.map((l) => { try { const d = decodeEventLog({ abi, data: l.data, topics: l.topics }); return { ...d, block: l.blockNumber }; } catch { return null; } }).filter(Boolean);
const tsCache = new Map(); const dayOf = async (blk) => { if (!tsCache.has(blk)) tsCache.set(blk, Number((await pc.getBlock({ blockNumber: blk })).timestamp)); return Math.floor((tsCache.get(blk) - epoch) / 86400) + 1; };
const gazes = Object.fromEntries(values.map(([id, s]) => [Number(id), s]));
// holders: a walk's seal flags tell us who held the Chog when it began
const chainWalks = []; for (let i = 1; i <= walkCount; i++) chainWalks.push(await pc.readContract({ address: TWAIN, abi, functionName: "walk", args: [BigInt(i)] }));
const holders = {}; chainWalks.forEach((w) => { if (w.sealA) holders[Number(w.chogA)] = w.walkerA; if (w.sealB) holders[Number(w.chogB)] = w.walkerB; });
let world = newWorld({ gazes, holders, lanternPrice: await pc.readContract({ address: TWAIN, abi, functionName: "LANTERN_PRICE" }), balances: new Proxy({}, { get: () => 10n ** 30n, set: () => true }) });
// balances proxy: an unlimited wallet; the real transfers are checked by the contract itself
world.balances = {};
const BIG = 10n ** 30n;
const bal = (w, a) => { w.balances[a] = BIG; };
let replayErr = null;
for (const e of events) {
  const a = e.args ?? {};
  const day = await dayOf(e.block);
  if (day > world.day) world = apply(world, { type: "advance", days: day - world.day }).world;
  try {
    if (e.eventName === "Opened") { bal(world, a.walkerA); world = apply(world, { type: "open", who: a.walkerA, chog: Number(a.chogA), distance: Number(a.distance), pledge: a.pledge, invitee: a.invitee }).world; }
    else if (e.eventName === "Joined") { bal(world, a.walkerB); world = apply(world, { type: "join", who: a.walkerB, walkId: Number(a.walkId), chog: Number(a.chogB) }).world; }
    else if (e.eventName === "ShowedUp") { if (!/^0x6a6f696e6564/.test(a.note)) world = apply(world, { type: "showUp", who: a.walker, walkId: Number(a.walkId) }).world; }
    else if (e.eventName === "LanternLit") { bal(world, a.by); world = apply(world, { type: "light", who: a.by, walkId: Number(a.walkId) }).world; }
    else if (e.eventName === "Cheered") world = apply(world, { type: "cheer", who: a.by, walkId: Number(a.walkId) }).world;
    else if (e.eventName === "Cancelled") { const w = world.walks[Number(a.walkId)]; world = apply(world, { type: "cancel", who: w.walkerA, walkId: Number(a.walkId) }).world; }
    else if (e.eventName === "Apart" && a.leaver !== "0x0000000000000000000000000000000000000000") world = apply(world, { type: "leave", who: a.leaver, walkId: Number(a.walkId) }).world;
  } catch (err) { replayErr = `${e.eventName} walk ${a.walkId}: ${err.name_ ?? err.message}`; break; }
}
report(!replayErr, `replayed ${events.length} events of ${walkCount} walks through packages/rules`, replayErr ?? "");
const todayChain = Number(await pc.readContract({ address: TWAIN, abi, functionName: "today" }));
if (todayChain > world.day) world = apply(world, { type: "advance", days: todayChain - world.day }).world;
for (let i = 1; i <= walkCount; i++) {
  const [pv] = await pc.readContract({ address: TWAIN, abi, functionName: "preview", args: [BigInt(i)] }).then((r) => [r[0]]);
  const mine = preview(world, i).walk;
  const f = (x) => `${x.status}/${x.gap}/${x.steps}/${x.missStreak}/${x.lanterns}/${x.forfeitA}/${x.forfeitB}`;
  const chainStr = f({ status: Number(pv.status), gap: Number(pv.gap), steps: Number(pv.steps), missStreak: Number(pv.missStreak), lanterns: Number(pv.lanterns), forfeitA: pv.forfeitA, forfeitB: pv.forfeitB });
  report(chainStr === f(mine), `walk ${i}: engine equals chain preview()`, `status/gap/steps/miss/lanterns/forfeits = ${chainStr}`);
}

// 4. postcards
const PC = env.NEXT_PUBLIC_POSTCARD;
if (PC) {
  const total = Number(await pc.readContract({ address: PC, abi: pcAbi, functionName: "total" }));
  const met = chainWalks.filter((w) => Number(w.status) === 3).length;
  report(total === met * 2, `postcards printed (${total}) equal two per meeting (${met})`);
  for (let id = 1; id <= total; id++) {
    const uri = await pc.readContract({ address: PC, abi: pcAbi, functionName: "tokenURI", args: [BigInt(id)] });
    const j = JSON.parse(Buffer.from(uri.replace("data:application/json;base64,", ""), "base64").toString());
    const svg = Buffer.from(j.image.replace("data:image/svg+xml;base64,", ""), "base64").toString();
    const card = await pc.readContract({ address: PC, abi: pcAbi, functionName: "cards", args: [BigInt(id)] });
    const w = chainWalks[Number(card[0]) - 1];
    const okCard = w && Number(w.status) === 3 && Number(card[3]) === Number(w.distance) && svg.includes("They met.") && j.name === `Chog ${card[1]} met Chog ${card[2]}`;
    report(!!okCard, `postcard ${id} decodes and matches walk ${card[0]}`);
  }
}
console.log(fails ? `\n${fails} check(s) FAILED` : "\nall checks PASS");
process.exit(fails ? 1 : 0);