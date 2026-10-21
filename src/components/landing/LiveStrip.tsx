"use client";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import { DEPLOYED } from "@/lib/contracts";
import { ACTIVE_CHAIN } from "@/lib/chains";
import { readCounters, stepsPerDay } from "@/lib/twain";
import { chogAmount, num } from "@/lib/format";

/** Live numbers from contract storage. Skeleton while loading; a plain sentence when there is no contract. */
export function LiveStrip() {
  const pc = usePublicClient({ chainId: ACTIVE_CHAIN.id }) as PublicClient | undefined;
  const q = useQuery({
    queryKey: ["strip"],
    queryFn: async () => { const c = await readCounters(pc!); const d = await stepsPerDay(pc!, c.today, 1); return { c, today: d[d.length - 1]?.steps ?? 0 }; },
    enabled: !!pc && DEPLOYED, refetchInterval: 15_000,
  });
  if (!DEPLOYED) return <p className="mono muted" data-testid="live-strip">Live numbers appear here once this build points at the deployed contract.</p>;
  const c = q.data?.c;
  const cell = (label: string, v: string | undefined) => (
    <div className="stack" style={{ ["--gap" as string]: "2px" }}>
      <span className="label">{label}</span>
      {v === undefined ? <span className="skeleton" style={{ display: "block", width: 60, height: 22, borderRadius: 6, background: "var(--paper-2)" }} /> : <span className="display" style={{ fontSize: "1.7rem" }}>{v}</span>}
    </div>
  );
  return (
    <div className="row" style={{ gap: 28 }} data-avoid data-testid="live-strip" aria-label="Live from the contract">
      {cell("Steps today", q.data ? num(q.data.today) : undefined)}
      {cell("Steps taken", c ? num(c.totalSteps) : undefined)}
      {cell("Meetings", c ? num(c.meetings) : undefined)}
      {cell("$CHOG burned in lanterns", c ? chogAmount(BigInt(c.lanternsLit) * c.lanternPrice, 0) : undefined)}
    </div>
  );
}