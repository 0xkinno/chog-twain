import { readFileSync } from "node:fs";

export const RPC = "http://127.0.0.1:8545";
export async function rpc(method: string, params: unknown[] = []) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}
export async function warpDays(n: number) {
  await rpc("evm_increaseTime", [n * 86400]);
  await rpc("evm_mine", []);
}
export const seed = () => JSON.parse(readFileSync("tests/e2e/.seed.json", "utf8")) as { open: number; walking: number; drifted: number; lantern: number; met: number; apart: number; tokens: { openChog: number; walkingA: number; walkingB: number } };
export function lists() {
  const g = JSON.parse(readFileSync("data/gaze.json", "utf8")) as { proofs: Record<string, { side: number }> };
  const L: number[] = [], R: number[] = [], F: number[] = [];
  for (const [id, v] of Object.entries(g.proofs)) (v.side === 1 ? L : v.side === 2 ? R : F).push(Number(id));
  return { L, R, F };
}