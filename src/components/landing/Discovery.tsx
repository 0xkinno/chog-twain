"use client";
import { useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import stats from "../../../data/gaze-stats.json";
import { ALL } from "@/lib/chogs";
import { ChogImg } from "@/components/ui/ChogImg";
import { Reveal } from "@/components/ui/Reveal";

const nf = (n: number) => n.toLocaleString("en-US");

export function Discovery() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 }), sy = useSpring(my, { stiffness: 90, damping: 18 });
  const rotY = useTransform(sx, [-1, 1], [-7, 7]);
  const rotX = useTransform(sy, [-1, 1], [5, -5]);
  // 48 real thumbnails sorted by gaze: left, then right, then every 1:1
  const tiles = useMemo(() => {
    const left = ALL.filter((c) => c.gaze === 1).filter((_, i) => i % 41 === 0).slice(0, 16);
    const right = ALL.filter((c) => c.gaze === 2).filter((_, i) => i % 60 === 0).slice(0, 22);
    const front = ALL.filter((c) => c.gaze === 3).slice(0, 10);
    return [...left, ...right, ...front];
  }, []);
  return (
    <section className="section wrap" aria-labelledby="look-again">
      <Reveal>
        <div className="stack" style={{ ["--gap" as string]: "16px" }}>
          <span className="mono muted">01 {"\u00b7"} The discovery</span>
          <h2 id="look-again" className="display" style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>Look again.</h2>
          <p className="editorial" style={{ fontSize: "1.35rem", maxWidth: 720 }}>Every Chog already faces somewhere. Its face points left, points right, or looks straight out of the frame. Nobody used it. We made it the rule of the whole world.</p>
        </div>
      </Reveal>
      <div className="grid g3" style={{ marginTop: 36 }} data-testid="gaze-numbers">
        {([[stats.left, "look left", "left"], [stats.right, "look right", "right"], [stats.front, "look at you", "front"]] as const).map(([n, label, tone]) => (
          <Reveal key={label}><div className="glow-card flat stack" style={{ ["--gap" as string]: "4px" }}><span className={`numeral`} data-testid={`gaze-${tone}`} style={{ color: tone === "left" ? "var(--hood)" : tone === "right" ? "var(--pink)" : "var(--gold)" }}>{nf(n)}</span><span className="mono">Chogs {label}</span></div></Reveal>
        ))}
      </div>
      <div
        ref={ref}
        style={{ perspective: 900, marginTop: 36 }}
        onPointerMove={(e) => { if (reduce) return; const r = ref.current!.getBoundingClientRect(); mx.set(((e.clientX - r.left) / r.width) * 2 - 1); my.set(((e.clientY - r.top) / r.height) * 2 - 1); }}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
      >
        <motion.div style={{ rotateX: reduce ? 0 : rotX, rotateY: reduce ? 0 : rotY, transformStyle: "preserve-3d" }} className="mosaic" aria-label="48 real Chogs sorted by gaze: left, then right, then looking at you" data-testid="mosaic">
          {tiles.map((c) => (
            <div key={c.id} className={`mosaic-tile ${c.gaze === 1 ? "l" : c.gaze === 2 ? "r" : "f"}`} title={`Token ${c.id}`}><ChogImg id={c.id} thumb={128} /></div>
          ))}
        </motion.div>
      </div>
      <Reveal>
        <p className="editorial" style={{ fontSize: "1.5rem", marginTop: 28, maxWidth: 820 }} data-testid="discovery-line">
          Only left can walk toward right. At most <strong>{nf(stats.maxSimultaneousWalks)}</strong> walks can happen at once, and <strong>{nf(stats.rightAlwaysWaiting)}</strong> right-facing Chogs are always waiting for a partner.
        </p>
        <p className="muted" style={{ marginTop: 8, maxWidth: 760 }}>The gaze lives in IPFS metadata, not on-chain, so the contract is shown a Merkle proof against a root anyone can rebuild from the collection. The ten 1:1 legendaries look straight out and can meet anyone.</p>
      </Reveal>
    </section>
  );
}