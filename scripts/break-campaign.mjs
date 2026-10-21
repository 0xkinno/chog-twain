// Break campaign on MAINNET: one deliberately reverted transaction per guard, landed on chain with an explicit gas limit
// so the revert is a real transaction on the explorer. None needs a Chog. Hashes go to docs/break-campaign.json and EVIDENCE.md.
// Needs Kinnoski's go-ahead (TASK Phase 6, ASK). Run mainnet-walks.mjs first.
// Usage: node scripts/break-campaign.mjs [--invite-expired]   (InviteExpired only works once a walk is more than 3 days old)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { send, proof, read, NOTE, ZERO, limits, gaze, E18, approve } from "./lib/mainnet.mjs";

const st = JSON.parse(readFileSync("docs/mainnet-state.json", "utf8"));
const OUT = "docs/break-campaign.json";
const done = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const has = (e) => done.some((d) => d.error === e);
const add = (error, note, r) => { done.push({ error, hash: r.hash, status: r.status, block: r.block, note, simulated: r.revertName }); writeFileSync(OUT, JSON.stringify(done, null, 1) + "\n"); console.log(error.padEnd(14), r.status, r.hash); };
const g = (x) => BigInt(x);
const lefts = Object.entries(gaze.proofs).filter(([, v]) => v.side === 1).map(([k]) => Number(k));
const rights = Object.entries(gaze.proofs).filter(([, v]) => v.side === 2).map(([k]) => Number(k));
const tx = (w, functionName, args, label, gas) => send(w, { functionName, args, gas: BigInt(gas), label: `break: ${label}`, expectRevert: true });

if (!has("NotWalker")) add("NotWalker", "a fan (C) shows up on a walk that is not theirs", await tx("C", "showUp", [g(st.walk1), NOTE("not mine")], "NotWalker", limits.showUp));
if (!has("AlreadyToday")) add("AlreadyToday", "A shows up a second time on the same UTC day", await tx("A", "showUp", [g(st.walk1), NOTE("again")], "AlreadyToday", limits.showUp));
if (!has("SelfWalk")) { const p = proof(rights[5]); add("SelfWalk", "A tries to join the walk A opened", await tx("A", "join", [g(st.walk2), g(rights[5]), p.side, p.proof], "SelfWalk", limits.join)); }
if (!has("NotFacing")) { const id = lefts[7]; const p = proof(id); add("NotFacing", "B joins walk 2 (token 2 looks left) with another left-looking Chog", await tx("B", "join", [g(st.walk2), g(id), p.side, p.proof], "NotFacing", limits.join)); }
if (!has("BadProof")) { const id = lefts[9]; const p = proof(id); add("BadProof", "A opens with token " + id + " claiming it looks right (it looks left), with the real proof", await tx("A", "open", [g(id), 2, p.proof, 7, 0n, ZERO], "BadProof", limits.open)); }
if (!has("ChogBusy")) { const p = proof(1); add("ChogBusy", "C tries to open a walk with token 1, which is walking in walk 1", await tx("C", "open", [g(1), p.side, p.proof, 7, 0n, ZERO], "ChogBusy", limits.open)); }
if (process.argv.includes("--invite-expired") && !has("InviteExpired")) { const p = proof(rights[6]); add("InviteExpired", "B joins walk 2 more than 3 days after it opened", await tx("B", "join", [g(st.walk2), g(rights[6]), p.side, p.proof], "InviteExpired", limits.join)); }
console.log(`${done.length} reverted transactions recorded in ${OUT}`);