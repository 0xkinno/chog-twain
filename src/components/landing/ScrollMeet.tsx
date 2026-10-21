"use client";
// The scroll story: as you scroll, two Chog discs walk toward each other along the gaze line. Footprints fill one
// by one, a drift shows once as a dotted backward print, a lantern glows once, and at the end they touch and a
// postmark thumps down. Driven by useScroll and useSpring. Reduced motion: the finished picture, no parallax.
import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ChogImg } from "@/components/ui/ChogImg";
import { LanternIcon, Postmark } from "@/components/ui/Icons";

const STEPS = 7;
const STAGES = [
  { at: 0, text: "Day 1. Both show up. One step closer." },
  { at: 0.22, text: "Day 3. Three steps walked. Four to go." },
  { at: 0.46, text: "Day 4. One of them forgets. The Chogs drift one step apart." },
  { at: 0.62, text: "A stranger lights a lantern. It keeps the next missed day." },
  { at: 0.8, text: "Day 8. Almost there. One step left." },
  { at: 0.96, text: "They meet. The meeting is written onto both Chogs." },
];

export function ScrollMeet() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 25%"] });
  const t = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const leftX = useTransform(t, [0, 1], ["0%", "42%"]);
  const rightX = useTransform(t, [0, 1], ["0%", "-42%"]);
  const [p, setP] = useState(reduce ? 1 : 0);
  useMotionValueEvent(t, "change", (v) => setP(v));
  const prog = reduce ? 1 : p;
  // the walk: steps fill with progress, one drift around 0.46
  const walked = Math.min(STEPS, Math.floor(prog * (STEPS + 1)));
  const drift = prog > 0.46 && prog < 0.6;
  const lantern = prog > 0.6;
  const met = prog > 0.94;
  const stage = [...STAGES].reverse().find((s) => prog >= s.at)!;
  return (
    <section className="section wrap" aria-labelledby="scroll-story" style={{ paddingBottom: 0 }}>
      <div className="stack" style={{ ["--gap" as string]: "12px" }}>
        <span className="mono muted">03 {"\u00b7"} A walk, start to finish</span>
        <h2 id="scroll-story" className="display" style={{ fontSize: "clamp(2.2rem,5vw,4rem)" }}>Scroll to walk.</h2>
      </div>
      <div ref={ref} style={{ height: reduce ? "auto" : "260vh", position: "relative", marginTop: 28 }} data-testid="scroll-meet">
        <div style={{ position: reduce ? "relative" : "sticky", top: 90, minHeight: 520 }} className="stack">
          <div className="glow-card flat" style={{ padding: "28px 18px", overflow: "hidden", background: "linear-gradient(180deg,#efe9ff,#fff 60%)" }}>
            <div style={{ position: "relative", height: 300 }}>
              <svg viewBox="0 0 1000 300" width="100%" height="300" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }} aria-hidden>
                <path d={`M 230 140 Q 500 ${met ? 140 : 90} 770 140`} fill="none" stroke="#ff7aa8" strokeWidth="4" strokeLinecap="round" strokeDasharray={met ? "1 6" : "2 12"} />
              </svg>
              <motion.div style={{ x: reduce ? "42%" : leftX, position: "absolute", left: "4%", top: 20, width: "min(24vw,200px)" }}>
                <div className="sticker"><ChogImg id={1} eager /></div>
              </motion.div>
              <motion.div style={{ x: reduce ? "-42%" : rightX, position: "absolute", right: "4%", top: 20, width: "min(24vw,200px)" }}>
                <div className="sticker"><ChogImg id={846} eager /></div>
              </motion.div>
              {lantern && !met && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", filter: "drop-shadow(0 0 18px #ffd86b)" }}><LanternIcon width={44} height={56} /></div>}
              {met && <motion.div initial={{ scale: 2.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: -12, opacity: 0.92 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} style={{ position: "absolute", left: "50%", top: -10, marginLeft: -80, color: "#c0366c" }}><Postmark text="Chog Twain · Day 9 · Met" size={160} /></motion.div>}
            </div>
            <div className="row" style={{ justifyContent: "center", gap: 6, flexWrap: "nowrap", overflowX: "auto" }} aria-label={`${walked} of ${STEPS} footprints filled`} data-testid="scroll-prints">
              {Array.from({ length: STEPS }, (_, i) => (
                <svg key={i} viewBox="-12 -14 24 28" width="26" height="30" aria-hidden><g fill={i < walked ? "#23164d" : "none"} stroke={i < walked ? "none" : "rgba(35,22,77,.45)"} strokeWidth="2" strokeDasharray={i < walked ? undefined : "3 4"}><ellipse cx="0" cy="3" rx="5.2" ry="7.2" /><circle cx="-4.6" cy="-8.2" r="1.9" /><circle cx="-1.4" cy="-10.4" r="1.9" /><circle cx="2" cy="-10.4" r="1.9" /><circle cx="5" cy="-8.2" r="1.7" /></g></svg>
              ))}
              {drift && <svg viewBox="-12 -14 24 28" width="26" height="30" aria-label="a step taken back"><g fill="none" stroke="#ff7aa8" strokeWidth="2.5" strokeDasharray="2 5"><ellipse cx="0" cy="3" rx="5.2" ry="7.2" /></g></svg>}
            </div>
          </div>
          <p className="editorial" style={{ fontSize: "1.4rem", textAlign: "center", minHeight: 64 }} aria-live="polite" data-testid="scroll-stage">{stage.text}</p>
          <p className="mono muted" style={{ textAlign: "center" }}>The day turns at 00:00 UTC.</p>
        </div>
      </div>
    </section>
  );
}