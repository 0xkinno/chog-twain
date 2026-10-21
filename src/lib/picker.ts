import type { Address, PublicClient } from "viem";
import { ALL, canFace, type ChogRow } from "./chogs";
import { CHOG_GENESIS, ERC721_ABI, TWAIN, TWAIN_ABI } from "./contracts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Which of these Chogs are walking right now (activeWalkOf through Multicall3, batches of 200, 250 ms apart). */
export async function activeFor(pc: PublicClient, ids: number[]): Promise<Record<number, number>> {
  const out: Record<number, number> = {};
  if (!TWAIN) return out;
  const T: Address = TWAIN;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const r = await pc.multicall({ allowFailure: true, contracts: chunk.map((id) => ({ address: T, abi: TWAIN_ABI, functionName: "activeWalkOf", args: [BigInt(id)] })) });
    r.forEach((x, k) => { out[chunk[k]] = x.status === "success" ? Number(x.result) : 0; });
    if (i + 200 < ids.length) await sleep(250);
  }
  return out;
}

/** Optional: Chogs the wallet holds (balanceOf, then Multicall ownerOf). Never required. */
export async function heldBy(pc: PublicClient, who: Address): Promise<number[]> {
  const bal = Number(await pc.readContract({ address: CHOG_GENESIS, abi: ERC721_ABI, functionName: "balanceOf", args: [who] }));
  if (!bal) return [];
  const held: number[] = [];
  for (let i = 1; i <= 1969 && held.length < bal; i += 200) {
    const ids = Array.from({ length: Math.min(200, 1970 - i) }, (_, k) => i + k);
    const r = await pc.multicall({ allowFailure: true, contracts: ids.map((id) => ({ address: CHOG_GENESIS, abi: ERC721_ABI, functionName: "ownerOf", args: [BigInt(id)] })) });
    r.forEach((x, k) => { if (x.status === "success" && String(x.result).toLowerCase() === who.toLowerCase()) held.push(ids[k]); });
    await sleep(250);
  }
  return held;
}

export interface Filter {
  gaze: 0 | 1 | 2 | 3; // 0 = any
  aura: string;
  head: string;
  freeOnly: boolean;
  /** when joining: only Chogs that can face this Chog */
  facing?: number;
  /** free text: token id or artwork number */
  q: string;
}

export const emptyFilter: Filter = { gaze: 0, aura: "", head: "", freeOnly: false, q: "" };

export function applyFilter(f: Filter, active: Record<number, number>, held: Set<number>): ChogRow[] {
  const q = f.q.trim().replace(/^#/, "");
  const list = ALL.filter((c) => {
    if (f.facing && !canFace(f.facing, c.id)) return false;
    if (f.gaze && c.gaze !== f.gaze) return false;
    if (f.aura && c.aura !== f.aura) return false;
    if (f.head && c.head !== f.head) return false;
    if (f.freeOnly && (active[c.id] ?? 0) !== 0) return false;
    if (q && !(String(c.id) === q || String(c.art) === q)) return false;
    return true;
  });
  // holder extras: the wallet's own Chogs first, with a "Yours" badge in the UI
  return list.sort((a, b) => Number(held.has(b.id)) - Number(held.has(a.id)) || a.id - b.id);
}

export const AURAS = [...new Set(ALL.map((c) => c.aura).filter(Boolean))].sort();
export const HEADS = [...new Set(ALL.map((c) => c.head).filter(Boolean))].sort();