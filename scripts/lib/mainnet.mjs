// Shared helpers for scripts that act on Monad MAINNET with the Chog Twain test wallets (keys in .env.local).
// Every write sends an explicit gas limit from src/lib/gas-limits.json, like the app does.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createPublicClient, createWalletClient, defineChain, http, decodeErrorResult, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const RPC = process.env.MONAD_RPC_URL ?? "https://rpc.monad.xyz";
export const chain = defineChain({ id: 143, name: "Monad", nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [RPC] } }, contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } } });
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
export const TWAIN = env.NEXT_PUBLIC_TWAIN;
export const TOKEN = env.NEXT_PUBLIC_CHOG_TOKEN;
export const abi = JSON.parse(readFileSync("src/lib/abi/ChogTwain.json", "utf8"));
export const erc20 = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
];
export const limits = JSON.parse(readFileSync("src/lib/gas-limits.json", "utf8"));
export const gaze = JSON.parse(readFileSync("data/gaze.json", "utf8"));
export const E18 = 10n ** 18n;
export const ZERO = "0x0000000000000000000000000000000000000000";
export const NOTE = (t = "") => "0x" + Buffer.from(t).toString("hex").padEnd(56, "0");

export const pc = createPublicClient({ chain, transport: http(RPC) });
const keyOf = { D: env.DEPLOYER_KEY, A: env.TEST_WALLET_A_KEY, B: env.TEST_WALLET_B_KEY, C: env.TEST_WALLET_C_KEY };
export const who = Object.fromEntries(Object.entries(keyOf).map(([k, v]) => { const account = privateKeyToAccount(v); return [k, { account, wc: createWalletClient({ account, chain, transport: http(RPC) }) }]; }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EV = "docs/evidence-txs.json";
export const evidence = () => (existsSync(EV) ? JSON.parse(readFileSync(EV, "utf8")) : []);
export function record(entry) {
  const all = evidence();
  all.push({ ...entry, at: new Date().toISOString() });
  mkdirSync("docs", { recursive: true });
  writeFileSync(EV, JSON.stringify(all, null, 1) + "\n");
}

/** Sends one write, returns hashes, block, proposed and finalized latencies, MON actually spent. */
export async function send(w, { address = TWAIN, abi: a = abi, functionName, args = [], gas, label, expectRevert = false }) {
  const acct = who[w].account.address;
  const before = await pc.getBalance({ address: acct });
  let revertName = null;
  if (expectRevert) {
    try { await pc.simulateContract({ account: acct, address, abi: a, functionName, args }); } catch (e) { revertName = e?.cause?.data?.errorName ?? e?.cause?.cause?.data?.errorName ?? e?.shortMessage ?? "reverted"; }
  }
  if (!expectRevert) { try { const est = await pc.estimateContractGas({ account: acct, address, abi: a, functionName, args }); const padded = (est * 125n) / 100n; if (!gas || padded > gas) gas = padded; } catch {} }
  const t0 = performance.now();
  const hash = await who[w].wc.writeContract({ address, abi: a, functionName, args, gas });
  let rc = null;
  for (let i = 0; i < 400 && !rc; i++) { try { rc = await pc.getTransactionReceipt({ hash }); } catch { await sleep(300); } }
  const tProposed = performance.now();
  let tFinal = null;
  for (let i = 0; i < 300; i++) { try { const f = await pc.getBlock({ blockTag: "finalized" }); if (f.number >= rc.blockNumber) { tFinal = performance.now(); break; } } catch {} await sleep(400); }
  const after = await pc.getBalance({ address: acct });
  const out = { hash, status: rc.status, block: Number(rc.blockNumber), gasUsed: Number(rc.gasUsed), gasLimit: Number(gas ?? 0), proposedMs: Math.round(tProposed - t0), finalMs: tFinal ? Math.round(tFinal - t0) : null, feeMon: Number(before - after) / 1e18, revertName };
  if (label) record({ label, fn: functionName, wallet: w, ...out });
  if (!expectRevert && rc.status !== "success") throw new Error(`${functionName} reverted on chain: ${hash}`);
  return out;
}
export async function approve(w, amount, label) {
  const have = await pc.readContract({ address: TOKEN, abi: erc20, functionName: "allowance", args: [who[w].account.address, TWAIN] });
  if (have >= amount) return null;
  return send(w, { address: TOKEN, abi: erc20, functionName: "approve", args: [TWAIN, amount], gas: BigInt(limits.approve ?? 80000), label });
}
export const proof = (id) => gaze.proofs[String(id)];
export const walkCount = async () => Number(await pc.readContract({ address: TWAIN, abi, functionName: "walkCount" }));
export const read = (functionName, args = []) => pc.readContract({ address: TWAIN, abi, functionName, args });
export const chogBal = (w) => pc.readContract({ address: TOKEN, abi: erc20, functionName: "balanceOf", args: [who[w].account.address] });
export const fmt = (wei) => (Number(wei) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 3 });
export { parseUnits, decodeErrorResult };