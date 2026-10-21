"use client";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import { ACTIVE_CHAIN } from "@/lib/chogs-chain";
import { DEPLOYED } from "@/lib/contracts";
import { everyWalk, readCounters, stepsPerDay, type Counters } from "@/lib/twain";
import { MET, OPEN, WALKING, type Walk } from "@rules";
import { getChog } from "@/lib/chogs";

export interface Heartbeat {
  counters: Counters;
  days: { day: number; steps: number }[];
  walksToday: number;
  mostMet: { id: number; met: number }[];
  longestMet: Walk[];
  litPerWalk: { id: number; lit: number }[];
  moved: bigint;
  inUse: { left: number; right: number; front: number };
  walks: Walk[];
}

/** Everything the Heartbeat shows, from contract storage only (views and multicall). No log scans. */
export function useHeartbeat() {
  const pc = usePublicClient({ chainId: ACTIVE_CHAIN.id }) as PublicClient | undefined;
  return useQuery<Heartbeat>({
    queryKey: ["heartbeat"],
    enabled: !!pc && DEPLOYED,
    refetchInterval: 20_000,
    queryFn: async () => {
      const c = await readCounters(pc!);
      const [days, walks] = await Promise.all([stepsPerDay(pc!, c.today, 14), everyWalk(pc!, Math.min(c.walkCount, 1500))]);
      const met = new Map<number, number>();
      let moved = 0n;
      const inUse = { left: 0, right: 0, front: 0 };
      let walksToday = 0;
      for (const w of walks) {
        moved += w.forfeitA + w.forfeitB;
        if (w.status === MET) { met.set(w.chogA, (met.get(w.chogA) ?? 0) + 1); met.set(w.chogB, (met.get(w.chogB) ?? 0) + 1); }
        if (w.status === OPEN || w.status === WALKING) {
          for (const id of [w.chogA, w.chogB]) { if (!id) continue; const g = getChog(id)?.gaze; if (g === 1) inUse.left++; else if (g === 2) inUse.right++; else if (g === 3) inUse.front++; }
        }
        if (w.status === WALKING && w.curDay >= c.today - 1) walksToday++;
      }
      return {
        counters: c, days, walksToday,
        mostMet: [...met].map(([id, m]) => ({ id, met: m })).sort((a, b) => b.met - a.met || a.id - b.id).slice(0, 10),
        longestMet: walks.filter((w) => w.status === MET).sort((a, b) => b.distance - a.distance || b.steps - a.steps).slice(0, 5),
        litPerWalk: walks.filter((w) => w.lanternsUsed + w.lanterns > 0).map((w) => ({ id: w.id, lit: w.lanternsUsed + w.lanterns })).sort((a, b) => b.lit - a.lit).slice(0, 5),
        moved, inUse, walks,
      };
    },
  });
}