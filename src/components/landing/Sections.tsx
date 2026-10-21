import Link from "next/link";
import { GlowCard } from "@/components/ui/GlowCard";
import { Reveal } from "@/components/ui/Reveal";
import { LanternIcon, PledgeJar, Stamp, Postmark } from "@/components/ui/Icons";
import { postcardSvg } from "@/lib/postcard";
import { ChogImg } from "@/components/ui/ChogImg";

const Num = ({ n, t }: { n: string; t: string }) => <span className="mono muted">{n} {"\u00b7"} {t}</span>;

export function HowItWorks() {
  const cards = [
    { stamp: "One step", body: "You both show up", sub: "On a day both of you tap I'm here, the two Chogs take one step closer.", tone: "#6c4ab6", art: <><circle r="26" fill="#efe9ff" stroke="#6c4ab6" strokeWidth="3" /><path d="M-14 6q7 9 14 0t14 0" fill="none" stroke="#ff7aa8" strokeWidth="3" strokeLinecap="round" /></> },
    { stamp: "One apart", body: "Someone misses", sub: "A missed day drifts them one step apart. Steps already walked are never taken back. Three unkept days in a row part them for good.", tone: "#b02a62", art: <><circle r="26" fill="#ffe8f1" stroke="#b02a62" strokeWidth="3" /><path d="M-14 8q7 -9 14 0t14 0" fill="none" stroke="#b02a62" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 5" /></> },
    { stamp: "Met", body: "The gap reaches zero", sub: "They meet. It is written onto both Chogs, two postcards print, and both Chogs are free to walk again.", tone: "#14704d", art: <><circle r="26" fill="#dcf6ea" stroke="#14704d" strokeWidth="3" /><path d="M-10 0l7 8 14-16" fill="none" stroke="#14704d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></> },
  ];
  return (
    <section className="section wrap" aria-labelledby="how">
      <Reveal><div className="stack" style={{ ["--gap" as string]: "12px" }}><Num n="02" t="How a walk works" /><h2 id="how" className="display" style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>Three rules. That is the whole game.</h2></div></Reveal>
      <div className="grid g3" style={{ marginTop: 32 }}>
        {cards.map((c, i) => (
          <Reveal key={c.stamp} delay={i * 0.08}>
            <GlowCard className="stack" style={{ ["--gap" as string]: "14px", height: "100%" }}>
              <Stamp label={c.stamp} tone={c.tone} size={96}>{c.art}</Stamp>
              <h3>{c.body}</h3><p className="muted">{c.sub}</p>
            </GlowCard>
          </Reveal>
        ))}
      </div>
      <p className="mono muted" style={{ marginTop: 18 }}>The day turns at 00:00 UTC. Distances: 7, 14 or 30 days.</p>
    </section>
  );
}

export function Leaves() {
  const svg = `data:image/svg+xml;base64,${Buffer.from(postcardSvg(1462, 338, 7, 214, 9)).toString("base64")}`;
  return (
    <section className="section wrap" aria-labelledby="leaves">
      <Reveal><div className="stack" style={{ ["--gap" as string]: "12px" }}><Num n="04" t="What the meeting leaves behind" /><h2 id="leaves" className="display" style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>A meeting cannot be bought or rushed.</h2>
        <p className="editorial" style={{ fontSize: "1.35rem", maxWidth: 740 }}>It takes at least N real days on which both people showed up. When it happens, three things last.</p></div></Reveal>
      <div className="grid g3" style={{ marginTop: 32 }}>
        <Reveal><GlowCard className="stack" style={{ ["--gap" as string]: "10px", height: "100%" }}><h3>A postcard each</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svg} alt="Example of the on-chain postcard layout" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--line)" }} />
          <p className="muted">Printed fully on-chain at the moment of meeting, and soulbound: it cannot be sold or moved. Example layout shown.</p></GlowCard></Reveal>
        <Reveal delay={0.08}><GlowCard className="stack" style={{ ["--gap" as string]: "10px", height: "100%" }}><h3>A Friend Book entry</h3>
          <div className="stack" style={{ ["--gap" as string]: "8px" }}>
            {[[1462, "met 1 friend", "7 days"], [338, "met 1 friend", "7 days"]].map(([id, a, b]) => <div key={String(id)} className="row" style={{ flexWrap: "nowrap", gap: 12 }}><div className="sticker" style={{ width: 64, flex: "none" }}><ChogImg id={id === 1462 ? 1 : 846} /></div><div className="stack" style={{ ["--gap" as string]: "0" }}><strong style={{ fontFamily: "var(--font-fredoka)" }}>CHOG #{id}</strong><span className="mono muted">{a} {"\u00b7"} {b}</span></div></div>)}
          </div>
          <p className="muted">Each Chog remembers every walk it finished, with whom and how long it took. It follows the token if it is sold, and any app can read it.</p></GlowCard></Reveal>
        <Reveal delay={0.16}><GlowCard className="stack" style={{ ["--gap" as string]: "10px", height: "100%" }}><h3>A meeting card</h3>
          <div style={{ aspectRatio: "1200/630", borderRadius: 12, border: "1px solid var(--line)", background: "linear-gradient(135deg,#efe9ff,#fff,#ffe8f1)", display: "grid", placeItems: "center", color: "#c0366c", position: "relative" }}><Postmark text="Chog Twain · Day 9 · Block" size={120} /></div>
          <p className="muted">A 1200 by 630 image of the two artworks meeting, with the day count and the block of the meeting transaction, ready to post.</p></GlowCard></Reveal>
      </div>
    </section>
  );
}

export function LanternsPledges() {
  return (
    <section className="section wrap" aria-labelledby="lp">
      <Reveal><div className="stack" style={{ ["--gap" as string]: "12px" }}><Num n="05" t="Lanterns and pledges" /><h2 id="lp" className="display" style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>Other people can help. Money can stand behind a promise.</h2></div></Reveal>
      <div className="grid g2" style={{ marginTop: 32 }}>
        <Reveal><GlowCard className="row lantern-card" style={{ flexWrap: "nowrap", gap: 20, height: "100%" }}><div className="lantern-glow"><LanternIcon /></div><div className="stack" style={{ ["--gap" as string]: "8px" }}><h3>Light a lantern</h3><p className="muted">Anyone can light one for any walk. It burns $CHOG to a dead address and keeps a day only one of you made. Never a day nobody came. At most three per walk.</p></div></GlowCard></Reveal>
        <Reveal delay={0.08}><GlowCard className="row" style={{ flexWrap: "nowrap", gap: 20, height: "100%" }}><PledgeJar /><div className="stack" style={{ ["--gap" as string]: "8px" }}><h3>Put $CHOG on it</h3><p className="muted">Both put in the same. Meet and it comes back whole. Miss a day and a slice goes to your friend. Walk away and the whole pledge does. Optional, and the walk works without it.</p></div></GlowCard></Reveal>
      </div>
    </section>
  );
}

export function ProofStrip() {
  const items = [
    ["One contract, no admin", "No owner, no pause, no upgrade. The rules cannot change under a walk."],
    ["Nobody needs to own a Chog", "Pick any of the 1,969. A holder gets an optional seal and a home-only switch."],
    ["Verified on Sourcify", "Source and metadata published, so what you read is what runs."],
    ["Break it yourself", "Every guard has a reverted transaction on mainnet and a test that fails if the rule moves."],
  ];
  return (
    <section className="section wrap" aria-labelledby="proofstrip">
      <Reveal><div className="stack" style={{ ["--gap" as string]: "12px" }}><Num n="07" t="Proof" /><h2 id="proofstrip" className="display" style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>Do not trust the page. Check it.</h2></div></Reveal>
      <div className="grid g4" style={{ marginTop: 32 }}>
        {items.map(([h, p], i) => <Reveal key={h} delay={i * 0.06}><Link href="/proof" style={{ textDecoration: "none" }}><GlowCard className="stack" style={{ ["--gap" as string]: "8px", height: "100%" }}><h3 style={{ fontSize: "1.25rem" }}>{h}</h3><p className="muted">{p}</p></GlowCard></Link></Reveal>)}
      </div>
    </section>
  );
}