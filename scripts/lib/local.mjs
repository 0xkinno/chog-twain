// Shared helpers for scripts that talk to the local anvil chain (seed, gas table, measurements, e2e).
import { readFileSync, existsSync } from "node:fs";
import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
];

export const env = () => Object.fromEntries(readFileSync(".env.e2e", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
export const RPC = "http://127.0.0.1:8545";
export const chain = defineChain({ id: 31337, name: "anvil", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC] } }, contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } } });
export const abi = JSON.parse(readFileSync("src/lib/abi/ChogTwain.json", "utf8"));
export const erc20 = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
];
export const gaze = () => JSON.parse(readFileSync("data/gaze.json", "utf8"));

export function clients() {
  const e = env();
  const pc = createPublicClient({ chain, transport: http(RPC), pollingInterval: 100 });
  const accounts = KEYS.map((k) => privateKeyToAccount(k));
  const wcs = accounts.map((a) => createWalletClient({ account: a, chain, transport: http(RPC) }));
  return { pc, accounts, wcs, TWAIN: e.NEXT_PUBLIC_TWAIN, TOKEN: e.NEXT_PUBLIC_CHOG_TOKEN, GENESIS: e.NEXT_PUBLIC_CHOG_GENESIS };
}

export async function rpc(method, params = []) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}
/** Move chain time forward by whole days and mine a block. */
export async function warpDays(n) {
  await rpc("evm_increaseTime", [n * 86400]);
  await rpc("evm_mine", []);
}

/** Left, Right and Front token lists from our own gaze data. */
export function lists() {
  const g = gaze();
  const L = [], R = [], F = [];
  for (const [id, v] of Object.entries(g.proofs)) (v.side === 1 ? L : v.side === 2 ? R : F).push(Number(id));
  return { L, R, F, proofs: g.proofs };
}

export function makeApi() {
  const c = clients();
  const { proofs } = lists();
  const send = async (i, functionName, args, opts = {}) => {
    const hash = await c.wcs[i].writeContract({ address: c.TWAIN, abi, functionName, args, gas: opts.gas ?? 2_500_000n });
    const rc = await c.pc.waitForTransactionReceipt({ hash });
    if (rc.status !== "success") throw new Error(`${functionName} reverted (${hash})`);
    return rc;
  };
  const approve = async (i, amount) => {
    const hash = await c.wcs[i].writeContract({ address: c.TOKEN, abi: erc20, functionName: "approve", args: [c.TWAIN, amount] });
    await c.pc.waitForTransactionReceipt({ hash });
  };
  const ZERO = "0x0000000000000000000000000000000000000000";
  const open = async (i, chog, distance = 7, pledge = 0n, invitee = ZERO) => {
    if (pledge) await approve(i, pledge);
    const p = proofs[chog];
    const rc = await send(i, "open", [BigInt(chog), p.side, p.proof, distance, pledge, invitee]);
    return Number(await c.pc.readContract({ address: c.TWAIN, abi, functionName: "walkCount" })) && Number((await c.pc.readContract({ address: c.TWAIN, abi, functionName: "walkCount" })));
  };
  const join = async (i, walkId, chog, pledge = 0n) => {
    if (pledge) await approve(i, pledge);
    const p = proofs[chog];
    return send(i, "join", [BigInt(walkId), BigInt(chog), p.side, p.proof]);
  };
  const up = (i, walkId, note = "0x" + "00".repeat(28)) => send(i, "showUp", [BigInt(walkId), note]);
  const light = async (i, walkId) => { await approve(i, 100n * 10n ** 18n); return send(i, "light", [BigInt(walkId)]); };
  const walk = (id) => c.pc.readContract({ address: c.TWAIN, abi, functionName: "walk", args: [BigInt(id)] });
  return { ...c, send, approve, open, join, up, light, walk, ZERO };
}