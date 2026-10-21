// Storage-first reads: every page renders from contract views (walk, preview, walksOf, openWalks, friendBook,
// metCount, activeWalkOf, stepsOnDay, counters, claimable). Events are for audit and the verifier only.
import type { Address, PublicClient } from "viem";
import type { Walk, Status } from "@rules";
import { TWAIN, TWAIN_ABI, POSTCARD, POSTCARD_ABI } from "./contracts";

export function assertDeployed(): Address {
  if (!TWAIN) throw new Error("This build is not pointed at a deployed ChogTwain contract.");
  return TWAIN;
}

type Raw = Record<string, unknown>;
export function toWalk(id: number, r: Raw): Walk {
  const n = (k: string) => Number(r[k]);
  const b = (k: string) => Boolean(r[k]);
  return {
    id, chogA: n("chogA"), chogB: n("chogB"), status: n("status") as Status, distance: n("distance"), gap: n("gap"), steps: n("steps"),
    lanterns: n("lanterns"), lanternsUsed: n("lanternsUsed"), missStreak: n("missStreak"), missesA: n("missesA"), missesB: n("missesB"),
    aIn: b("aIn"), bIn: b("bIn"), stepped: b("stepped"), sealA: b("sealA"), sealB: b("sealB"), openedDay: n("openedDay"), startDay: n("startDay"),
    curDay: n("curDay"), endDay: n("endDay"), walkerA: String(r.walkerA), walkerB: String(r.walkerB), invitee: String(r.invitee),
    pledge: BigInt(r.pledge as bigint), forfeitA: BigInt(r.forfeitA as bigint), forfeitB: BigInt(r.forfeitB as bigint),
  };
}

export interface WalkView {
  walk: Walk; // stored
  now: Walk; // as it stands today, past days closed (preview)
  day: number;
  cheers: number;
  noteA?: { text: string; day: number };
  noteB?: { text: string; day: number };
}

export async function readWalk(pc: PublicClient, id: number): Promise<WalkView | null> {
  const addr = assertDeployed();
  const count = Number(await pc.readContract({ address: addr, abi: TWAIN_ABI, functionName: "walkCount" }));
  if (id < 1 || id > count) return null;
  const [w, pv, ch, na, nb] = await pc.multicall({
    allowFailure: false,
    contracts: [
      { address: addr, abi: TWAIN_ABI, functionName: "walk", args: [BigInt(id)] },
      { address: addr, abi: TWAIN_ABI, functionName: "preview", args: [BigInt(id)] },
      { address: addr, abi: TWAIN_ABI, functionName: "cheers", args: [BigInt(id)] },
      { address: addr, abi: TWAIN_ABI, functionName: "noteOf", args: [BigInt(id * 2)] },
      { address: addr, abi: TWAIN_ABI, functionName: "noteOf", args: [BigInt(id * 2 + 1)] },
    ],
  });
  const [pw, day] = pv as unknown as [Raw, number];
  const note = (x: unknown) => {
    const [text, d] = x as unknown as [string, number];
    return Number(d) ? { text, day: Number(d) } : undefined;
  };
  return { walk: toWalk(id, w as Raw), now: toWalk(id, pw), day: Number(day), cheers: Number(ch), noteA: note(na), noteB: note(nb) };
}

export async function readWalks(pc: PublicClient, ids: number[]): Promise<Walk[]> {
  if (!ids.length) return [];
  const addr = assertDeployed();
  const out: Walk[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150);
    const res = await pc.multicall({ allowFailure: false, contracts: chunk.map((id) => ({ address: addr, abi: TWAIN_ABI, functionName: "walk", args: [BigInt(id)] })) });
    res.forEach((r, k) => out.push(toWalk(chunk[k], r as Raw)));
  }
  return out;
}

export interface Counters {
  walkCount: number; meetings: number; totalSteps: number; totalShowUps: number; lanternsLit: number;
  pledgesHeld: bigint; lanternPrice: bigint; today: number; epoch: number; open: number[];
}

export async function readCounters(pc: PublicClient): Promise<Counters> {
  const a = assertDeployed();
  const f = (functionName: string) => ({ address: a, abi: TWAIN_ABI, functionName }) as const;
  const r = await pc.multicall({
    allowFailure: false,
    contracts: [f("walkCount"), f("meetings"), f("totalSteps"), f("totalShowUps"), f("lanternsLit"), f("pledgesHeld"), f("LANTERN_PRICE"), f("today"), f("EPOCH"), f("openWalks")],
  });
  return {
    walkCount: Number(r[0]), meetings: Number(r[1]), totalSteps: Number(r[2]), totalShowUps: Number(r[3]), lanternsLit: Number(r[4]),
    pledgesHeld: r[5] as bigint, lanternPrice: r[6] as bigint, today: Number(r[7]), epoch: Number(r[8]), open: (r[9] as number[]).map(Number),
  };
}

export async function stepsPerDay(pc: PublicClient, today: number, span = 14): Promise<{ day: number; steps: number }[]> {
  const a = assertDeployed();
  const days = Array.from({ length: span }, (_, i) => today - span + 1 + i).filter((d) => d >= 1);
  const r = await pc.multicall({ allowFailure: false, contracts: days.map((d) => ({ address: a, abi: TWAIN_ABI, functionName: "stepsOnDay", args: [BigInt(d)] })) });
  return days.map((d, i) => ({ day: d, steps: Number(r[i]) }));
}

export async function walksOf(pc: PublicClient, who: Address): Promise<number[]> {
  const r = (await pc.readContract({ address: assertDeployed(), abi: TWAIN_ABI, functionName: "walksOf", args: [who] })) as number[];
  return r.map(Number);
}

export async function friendBook(pc: PublicClient, token: number): Promise<number[]> {
  const r = (await pc.readContract({ address: assertDeployed(), abi: TWAIN_ABI, functionName: "friendBook", args: [BigInt(token)] })) as number[];
  return r.map(Number);
}

export async function claimable(pc: PublicClient, who: Address): Promise<bigint> {
  return (await pc.readContract({ address: assertDeployed(), abi: TWAIN_ABI, functionName: "claimable", args: [who] })) as bigint;
}

export async function chogState(pc: PublicClient, token: number) {
  const a = assertDeployed();
  const r = await pc.multicall({
    allowFailure: false,
    contracts: [
      { address: a, abi: TWAIN_ABI, functionName: "activeWalkOf", args: [BigInt(token)] },
      { address: a, abi: TWAIN_ABI, functionName: "homeOnly", args: [BigInt(token)] },
      { address: a, abi: TWAIN_ABI, functionName: "metCount", args: [BigInt(token)] },
    ],
  });
  return { activeWalk: Number(r[0]), homeOnly: Boolean(r[1]), met: Number(r[2]) };
}

export async function postcardsOf(pc: PublicClient, who: Address): Promise<{ id: number; uri: string }[]> {
  if (!POSTCARD) return [];
  const P: Address = POSTCARD;
  const bal = Number(await pc.readContract({ address: P, abi: POSTCARD_ABI, functionName: "balanceOf", args: [who] }));
  if (!bal) return [];
  const total = Number(await pc.readContract({ address: P, abi: POSTCARD_ABI, functionName: "total" }));
  const ids = Array.from({ length: total }, (_, i) => i + 1);
  const owners = await pc.multicall({ allowFailure: true, contracts: ids.map((id) => ({ address: P, abi: POSTCARD_ABI, functionName: "ownerOf", args: [BigInt(id)] })) });
  const mine = ids.filter((_, i) => owners[i].status === "success" && String(owners[i].result).toLowerCase() === who.toLowerCase());
  const uris = await pc.multicall({ allowFailure: false, contracts: mine.map((id) => ({ address: P, abi: POSTCARD_ABI, functionName: "tokenURI", args: [BigInt(id)] })) });
  return mine.map((id, i) => ({ id, uri: String(uris[i]) }));
}

/** Decode the on-chain postcard tokenURI (base64 JSON, image is an on-chain SVG). */
export function decodePostcard(uri: string): { name: string; description: string; svg: string; attributes: { trait_type: string; value: string | number }[] } {
  const json = JSON.parse(atob(uri.replace("data:application/json;base64,", "")));
  const svg = atob(String(json.image).replace("data:image/svg+xml;base64,", ""));
  return { name: json.name, description: json.description, svg, attributes: json.attributes };
}

export async function everyWalk(pc: PublicClient, count: number): Promise<Walk[]> {
  return readWalks(pc, Array.from({ length: count }, (_, i) => i + 1));
}
/** The two postcards printed for a walk (cards(id) holds the walk id). */
export async function postcardsForWalk(pc: PublicClient, walkId: number): Promise<{ id: number; owner: string; uri: string }[]> {
  if (!POSTCARD) return [];
  const P: Address = POSTCARD;
  const total = Number(await pc.readContract({ address: P, abi: POSTCARD_ABI, functionName: "total" }));
  if (!total) return [];
  const ids = Array.from({ length: total }, (_, i) => i + 1);
  const cards = await pc.multicall({ allowFailure: false, contracts: ids.map((id) => ({ address: P, abi: POSTCARD_ABI, functionName: "cards", args: [BigInt(id)] })) });
  const mine = ids.filter((_, i) => Number((cards[i] as unknown as unknown[])[0]) === walkId);
  if (!mine.length) return [];
  const [owners, uris] = await Promise.all([
    pc.multicall({ allowFailure: false, contracts: mine.map((id) => ({ address: P, abi: POSTCARD_ABI, functionName: "ownerOf", args: [BigInt(id)] })) }),
    pc.multicall({ allowFailure: false, contracts: mine.map((id) => ({ address: P, abi: POSTCARD_ABI, functionName: "tokenURI", args: [BigInt(id)] })) }),
  ]);
  return mine.map((id, i) => ({ id, owner: String(owners[i]), uri: String(uris[i]) }));
}

/** Verifies a claimed meeting block with ONE getLogs call over exactly that block (never scans). */
export async function verifyMeetBlock(pc: PublicClient, walkId: number, block: bigint): Promise<boolean> {
  try {
    const logs = await pc.getContractEvents({ address: assertDeployed(), abi: TWAIN_ABI, eventName: "Met", args: { walkId: BigInt(walkId) }, fromBlock: block, toBlock: block });
    return logs.length > 0;
  } catch {
    return false;
  }
}

/** Finds the meeting block when the walk ended recently: at most `windows` calls of 100 blocks, newest first. */
export async function findRecentMeetBlock(pc: PublicClient, walkId: number, windows = 3): Promise<bigint | null> {
  try {
    const head = await pc.getBlockNumber();
    for (let i = 0; i < windows; i++) {
      const to = head - BigInt(i * 100);
      const from = to - 99n;
      const logs = await pc.getContractEvents({ address: assertDeployed(), abi: TWAIN_ABI, eventName: "Met", args: { walkId: BigInt(walkId) }, fromBlock: from < 0n ? 0n : from, toBlock: to });
      if (logs.length) return logs[0].blockNumber;
    }
  } catch {
    /* public RPC refused the range: say nothing rather than guess */
  }
  return null;
}