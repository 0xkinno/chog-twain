// The first real walks on Monad mainnet, run with the Chog Twain test wallets. Budget aware ($CHOG is scarce):
//   A 100, B 100, C 70 $CHOG at the start; pledge 25 each on walk 1, one lantern (50) from the fan C.
// Idempotent: state is kept in docs/mainnet-state.json, finished steps are skipped.
// Usage: node scripts/mainnet-walks.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { who, send, approve, proof, walkCount, read, limits, E18, ZERO, NOTE, chogBal, fmt, TWAIN } from "./lib/mainnet.mjs";

const ST = "docs/mainnet-state.json";
const st = existsSync(ST) ? JSON.parse(readFileSync(ST, "utf8")) : {};
const save = () => writeFileSync(ST, JSON.stringify(st, null, 1) + "\n");
const g = (id) => BigInt(id);
const log = (...a) => console.log(...a);
log("start $CHOG:", "A", fmt(await chogBal("A")), "B", fmt(await chogBal("B")), "C", fmt(await chogBal("C")));

// Chogs: hero pair. Token 1 (CHOG #1462, looks left) and token 846 (CHOG #338, looks right).
const A_CHOG = 1, B_CHOG = 846, A2_CHOG = 2; // token 2 also looks left (used for the open walk 2)
const PLEDGE = 25n * E18;

if (!st.walk1) {
  await approve("A", PLEDGE, "approve 25 $CHOG (A)");
  const p = proof(A_CHOG);
  const r = await send("A", { functionName: "open", args: [g(A_CHOG), p.side, p.proof, 7, PLEDGE, ZERO], gas: BigInt(limits.open), label: "open walk 1 (token 1, 7 days, pledge 25)" });
  st.walk1 = await walkCount(); st.walk1Open = r.hash; save(); log("walk", st.walk1, "opened", r.hash);
}
if (!st.joined) {
  await approve("B", PLEDGE, "approve 25 $CHOG (B)");
  const p = proof(B_CHOG);
  const r = await send("B", { functionName: "join", args: [g(st.walk1), g(B_CHOG), p.side, p.proof], gas: BigInt(limits.join), label: "join walk 1 (token 846, pledge 25)" });
  st.joined = r.hash; save(); log("joined", r.hash);
}
if (!st.aShowed) {
  const w = await read("walk", [g(st.walk1)]);
  const gapOne = w.gap === 1 && w.bIn;
  const r = await send("A", { functionName: "showUp", args: [g(st.walk1), NOTE("landed in Leipzig")], gas: BigInt(gapOne ? limits.showUpMeet : limits.showUp), label: "I'm here (A, day 1, note) takes the first step" });
  st.aShowed = r.hash; save(); log("A showed up", r.hash);
}
if (!st.lantern) {
  await approve("C", 50n * E18, "approve 50 $CHOG (C, fan)");
  const r = await send("C", { functionName: "light", args: [g(st.walk1)], gas: BigInt(limits.light), label: "light a lantern (C, a fan with no Chog)" });
  st.lantern = r.hash; save(); log("lantern lit", r.hash);
}
if (!st.cheer) {
  const r = await send("C", { functionName: "cheer", args: [g(st.walk1)], gas: BigInt(limits.cheer), label: "cheer (C, a fan with no Chog)" });
  st.cheer = r.hash; save(); log("cheered", r.hash);
}
if (!st.walk2) {
  const p = proof(A2_CHOG);
  const r = await send("A", { functionName: "open", args: [g(A2_CHOG), p.side, p.proof, 7, 0n, ZERO], gas: BigInt(limits.open), label: "open walk 2 (token 2, 7 days, no pledge) waiting for a friend" });
  st.walk2 = await walkCount(); st.walk2Open = r.hash; save(); log("walk", st.walk2, "opened", r.hash);
}
log("end $CHOG:", "A", fmt(await chogBal("A")), "B", fmt(await chogBal("B")), "C", fmt(await chogBal("C")));
const w1 = await read("walk", [g(st.walk1)]);
log("walk 1:", { status: w1.status, gap: w1.gap, steps: w1.steps, lanterns: w1.lanterns, pledge: fmt(w1.pledge) });
log("pledgesHeld", fmt(await read("pledgesHeld")), "lanternsLit", Number(await read("lanternsLit")));