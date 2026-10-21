"use client";
import Link from "next/link";
import { StepsChart } from "@/components/heartbeat/StepsChart";
import { useHeartbeat } from "@/components/heartbeat/useHeartbeat";
import { DEPLOYED } from "@/lib/contracts";
import { chogLabel } from "@/lib/chogs";
import { Reveal } from "@/components/ui/Reveal";

export function HeartbeatPreview() {
  const hb = useHeartbeat();
  return (
    <section className="section wrap" aria-labelledby="hb">
      <Reveal><div className="stack" style={{ ["--gap" as string]: "12px" }}><span className="mono muted">06 {"\u00b7"} Heartbeat</span><h2 id="hb" className="display" style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>The world, live from storage.</h2></div></Reveal>
      <div className="grid g2" style={{ marginTop: 32, alignItems: "start" }}>
        <div className="glow-card flat stack">
          <h3>Steps per day, last 14 days</h3>
          {!DEPLOYED ? <p className="muted">Appears once this build points at the deployed contract.</p> : hb.data ? <StepsChart data={hb.data.days} /> : <p className="mono muted">Reading...</p>}
        </div>
        <div className="glow-card flat stack">
          <h3>Most-met Chogs</h3>
          {!DEPLOYED ? <p className="muted">Appears once there are meetings to count.</p> : hb.data && hb.data.mostMet.length ? (
            <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>{hb.data.mostMet.slice(0, 5).map((m) => <li key={m.id}><Link href={`/chog/${m.id}`} style={{ textDecoration: "underline" }}>{chogLabel(m.id)}</Link> <span className="mono muted">{m.met} met</span></li>)}</ol>
          ) : <p className="muted">No meetings yet. The first one will be written here.</p>}
          <Link href="/heartbeat" className="btn btn-ghost btn-small" style={{ alignSelf: "flex-start" }}>Open the Heartbeat</Link>
        </div>
      </div>
    </section>
  );
}