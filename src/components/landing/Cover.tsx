"use client";
import Link from "next/link";
import { useMemo } from "react";
import { newWorld, apply, sceneFor, type Traits } from "@rules";
import { Spread } from "@/components/chog/Spread";
import { FolioLine } from "@/components/ui/Icons";
import { getChog, GAZES } from "@/lib/chogs";
import { LiveStrip } from "./LiveStrip";

const traits = (id: number): Traits => { const c = getChog(id)!; return { Aura: c.aura || undefined, Background: c.bg || undefined, Eyes: c.eyes || undefined, Accessory: c.acc || undefined, Tier: c.tier }; };

// the hero pair: token 1 (CHOG #1462, looks left) and token 846 (CHOG #338, looks right)
const HERO = { left: 1, right: 846 };

export function Cover() {
  const scene = useMemo(() => {
    let w = newWorld({ gazes: GAZES });
    w = apply(w, { type: "open", who: "0xaaa", chog: HERO.left, distance: 7 }).world;
    w = apply(w, { type: "join", who: "0xbbb", walkId: 1, chog: HERO.right }).world;
    w = apply(w, { type: "showUp", who: "0xaaa", walkId: 1 }).world;
    for (let i = 0; i < 2; i++) { w = apply(w, { type: "advance", days: 1 }).world; w = apply(w, { type: "showUp", who: "0xaaa", walkId: 1 }).world; w = apply(w, { type: "showUp", who: "0xbbb", walkId: 1 }).world; }
    return sceneFor({ walk: w.walks[1], gazeA: GAZES[HERO.left], gazeB: GAZES[HERO.right], traitsA: traits(HERO.left), traitsB: traits(HERO.right), day: w.day, viewer: "0xaaa" });
  }, []);
  return (
    <section className="cover" aria-labelledby="hero">
      <div className="cover-bg" aria-hidden />
      <div className="wrap" style={{ paddingTop: 110, paddingBottom: 40 }}>
      <FolioLine extra="THE TRAVEL ISSUE" />
      <div className="stack" style={{ ["--gap" as string]: "18px", marginTop: 18 }}>
        <h1 id="hero" className="display sticker-type" style={{ fontSize: "clamp(3rem, 7.2vw, 7rem)", lineHeight: 1, maxWidth: 1150 }}>
          Every Chog is looking at <span style={{ color: "var(--hood)" }}>someone.</span>
        </h1>
        <p className="editorial" style={{ fontSize: "clamp(1.25rem,2.4vw,1.8rem)", maxWidth: 720 }}>
          Pick one. Send it to a friend. Every day you both show up, they step closer.
        </p>
        <div className="row" style={{ gap: 14 }}>
          <Link href="/walk/new" className="btn btn-big" data-testid="cta-start">Start a walk</Link>
          <Link href="/demo" className="btn btn-ghost btn-big" data-testid="cta-demo">Try it without a wallet</Link>
        </div>
        <LiveStrip />
      </div>
      <div style={{ marginTop: 34 }}>
        <Spread scene={scene} label="Two Chogs facing each other across a magazine spread, three of seven steps walked" />
        <p className="mono muted" style={{ textAlign: "center" }}>An example walk: token {HERO.left} looks left, token {HERO.right} looks right. Illustration, not a live walk.</p>
      </div>
      </div>
    </section>
  );
}