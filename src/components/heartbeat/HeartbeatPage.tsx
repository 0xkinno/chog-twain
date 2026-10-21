"use client";
import Link from "next/link";
import { GlowCard } from "@/components/ui/GlowCard";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { FolioLine } from "@/components/ui/Icons";
import { StepsChart } from "./StepsChart";
import { useHeartbeat } from "./useHeartbeat";
import { DEPLOYED } from "@/lib/contracts";
import { chogAmount, num } from "@/lib/format";
import { chogLabel } from "@/lib/chogs";
import stats from "../../../data/gaze-stats.json";

export function HeartbeatPage() {
  const q = useHeartbeat();
  const h = q.data;
  const big = (label: string, v: string | undefined, id?: string) => (
    <GlowCard className="stack" style={{ ["--gap" as string]: "2px" }}><span className="label">{label}</span><span className="display" data-testid={id} style={{ fontSize: "2.4rem" }}>{v ?? "..."}</span></GlowCard>
  );
  return (
    <div className="page wrap stack" style={{ ["--gap" as string]: "28px" }}>
      <header className="stack" style={{ ["--gap" as string]: "8px" }}>
        <FolioLine extra="HEARTBEAT" />
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.6rem,6.5vw,5rem)", lineHeight: 1 }}>Heartbeat</h1>
        <p className="editorial" style={{ fontSize: "1.3rem", maxWidth: 700 }}>Live from contract storage. Zeroes and walks that fell apart are shown as they are.</p>
      </header>
      {!DEPLOYED ? <NotDeployed what="The Heartbeat" /> : q.error ? <div className="notice bad" role="alert">The RPC did not answer: {(q.error as Error).message.split("\n")[0]}</div> : (
        <>
          <div className="grid g4" data-testid="heartbeat-numbers">
            {big("Walks opened", h ? num(h.counters.walkCount) : undefined, "hb-walks")}
            {big("Walking today", h ? num(h.walksToday) : undefined, "hb-today")}
            {big("Steps taken", h ? num(h.counters.totalSteps) : undefined, "hb-steps")}
            {big("Meetings", h ? num(h.counters.meetings) : undefined, "hb-meetings")}
            {big("Show-ups", h ? num(h.counters.totalShowUps) : undefined)}
            {big("$CHOG pledged now", h ? chogAmount(h.counters.pledgesHeld, 0) : undefined, "hb-pledged")}
            {big("$CHOG burned in lanterns", h ? chogAmount(BigInt(h.counters.lanternsLit) * h.counters.lanternPrice, 0) : undefined, "hb-burned")}
            {big("$CHOG moved by missed days", h ? chogAmount(h.moved, 0) : undefined, "hb-moved")}
          </div>
          <div className="grid g2" style={{ alignItems: "start" }}>
            <GlowCard className="flat stack"><h3>Steps per day, last 14 days</h3>{h ? <StepsChart data={h.days} /> : <p className="mono muted">Reading...</p>}</GlowCard>
            <GlowCard className="flat stack" data-testid="supply"><h3>Left and right, in use</h3>
              <p className="muted">Only left can walk toward right. Of {num(stats.left)} left-facing and {num(stats.right)} right-facing Chogs:</p>
              {h ? <div className="stack" style={{ ["--gap" as string]: "10px" }}>
                <Bar label="Left in walks" v={h.inUse.left} of={stats.left} color="var(--hood)" />
                <Bar label="Right in walks" v={h.inUse.right} of={stats.right} color="var(--pink)" />
                <Bar label="1:1 in walks" v={h.inUse.front} of={stats.front} color="var(--gold)" />
              </div> : <p className="mono muted">Reading...</p>}
            </GlowCard>
          </div>
          <div className="grid g3" style={{ alignItems: "start" }}>
            <GlowCard className="flat stack"><h3>Most-met Chogs</h3>{h?.mostMet.length ? <ol data-testid="most-met" style={{ margin: 0, paddingLeft: "1.2rem" }}>{h.mostMet.map((m) => <li key={m.id}><Link href={`/chog/${m.id}`} style={{ textDecoration: "underline" }}>{chogLabel(m.id)}</Link> <span className="mono muted">{m.met} met</span></li>)}</ol> : <p className="muted">No meetings yet.</p>}</GlowCard>
            <GlowCard className="flat stack"><h3>Longest walks met</h3>{h?.longestMet.length ? <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>{h.longestMet.map((w) => <li key={w.id}><Link href={`/w/${w.id}`} style={{ textDecoration: "underline" }}>Walk {w.id}</Link> <span className="mono muted">{w.distance} days, {w.steps} steps</span></li>)}</ol> : <p className="muted">No meetings yet.</p>}</GlowCard>
            <GlowCard className="flat stack"><h3>Most lanterns lit</h3>{h?.litPerWalk.length ? <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>{h.litPerWalk.map((w) => <li key={w.id}><Link href={`/w/${w.id}`} style={{ textDecoration: "underline" }}>Walk {w.id}</Link> <span className="mono muted">{w.lit} lit</span></li>)}</ol> : <p className="muted">No lanterns yet.</p>}</GlowCard>
          </div>
          <p className="mono muted">Day {h?.counters.today ?? "..."} {"\u00b7"} read from storage with Multicall3, no log scans</p>
        </>
      )}
    </div>
  );
}

function Bar({ label, v, of, color }: { label: string; v: number; of: number; color: string }) {
  return (
    <div className="stack" style={{ ["--gap" as string]: "4px" }}>
      <div className="row" style={{ justifyContent: "space-between" }}><span>{label}</span><span className="mono">{num(v)} of {num(of)}</span></div>
      <div style={{ height: 10, borderRadius: 5, background: "var(--paper-2)" }}><div style={{ width: `${Math.max(v ? 3 : 0, (v / of) * 100)}%`, height: "100%", borderRadius: 5, background: color }} /></div>
    </div>
  );
}