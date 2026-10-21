"use client";
// The spread: an open magazine across the screen. The right-facing Chog stands on the left page, the left-facing
// Chog on the right page, so they look at each other across the fold. Footprints run along the floor: filled for
// walked steps (from both ends, closing in), outlined for the gap that remains, dotted pink for a drift.
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { Scene, Side } from "@rules";
import { ChogImg } from "@/components/ui/ChogImg";
import { Footprint, LanternIcon, Postmark } from "@/components/ui/Icons";
import { chogLabel, getChog } from "@/lib/chogs";

type Orientation = "landscape" | "portrait";

const LAND = { W: 1000, H: 560, S: 200 };
const PORT = { W: 560, H: 1000, S: 210 };

export function useOrientation(force?: Orientation | "auto"): Orientation {
  const [o, setO] = useState<Orientation>("landscape");
  useEffect(() => {
    if (force && force !== "auto") { setO(force); return; }
    const mq = window.matchMedia("(max-width: 720px)");
    const on = () => setO(mq.matches ? "portrait" : "landscape");
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [force]);
  return o;
}

interface Props {
  scene: Scene;
  orientation?: Orientation | "auto";
  /** text for the postmark on a meeting: "CHOG TWAIN · DAY 214 · BLOCK 52,118,004" */
  postmark?: string;
  /** bumps when a step lands, to play the hop and the paper burst */
  stepSignal?: number;
  label?: string;
  /** the second page is an empty chair until a friend joins */
  inviteHint?: string;
}

export function Spread({ scene, orientation = "auto", postmark, stepSignal = 0, label, inviteHint }: Props) {
  const o = useOrientation(orientation);
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const g = o === "landscape" ? LAND : PORT;
  const { W, H, S } = g;
  const land = o === "landscape";
  const n = Math.max(1, scene.distance || 7);
  const met = scene.state === "met";
  const apart = scene.state === "apart";

  // position helpers: u runs along the main axis (0 outer left/top ... 1 outer right/bottom)
  const centre = (u: number) => (land ? { x: u * W, y: H * 0.46 } : { x: W * 0.42, y: u * H });
  const p = met ? 1 : Math.min(1, Math.max(0, scene.distance ? scene.walked / scene.distance : 0));
  const span = land ? 0.26 : 0.22;
  const start = land ? 0.14 : 0.17;
  const uLeft = start + p * span;
  const uRight = 1 - start - p * span;

  const left: Side | null = scene.a && scene.a.page === "left" ? scene.a : scene.b && scene.b.page === "left" ? scene.b : null;
  const right: Side | null = scene.a && scene.a.page === "right" ? scene.a : scene.b && scene.b.page === "right" ? scene.b : null;
  const skyOf = (s: Side | null, i: 0 | 1) => (s === scene.a ? scene.sky[0] : s === scene.b ? scene.sky[1] : scene.sky[i]);
  const skyL = skyOf(left, 0);
  const skyR = skyOf(right, 1);

  // footprint lane
  const filled = Math.min(n, scene.walked);
  const fromLeft = Math.ceil(filled / 2);
  const fromRight = Math.floor(filled / 2);
  const drifts = scene.footprints.filter((f) => f.drift).length;
  const lane = (k: number) => {
    const t = (k + 0.5) / n;
    if (land) return { x: W * (0.12 + t * 0.76), y: H * 0.86 + Math.sin(t * Math.PI * 2) * 10 };
    return { x: W * 0.9 + Math.sin(t * Math.PI * 3) * 12, y: H * (0.06 + t * 0.88) };
  };

  // gaze line between the eyes
  const eyeY = land ? centre(uLeft).y - 14 : 0;
  const a = land ? { x: centre(uLeft).x + S * 0.3, y: eyeY } : { x: centre(0).x, y: centre(uLeft).y + S * 0.5 };
  const b = land ? { x: centre(uRight).x - S * 0.3, y: eyeY } : { x: centre(0).x, y: centre(uRight).y - S * 0.5 };
  const bend = met ? 0 : Math.min(46, (land ? b.x - a.x : b.y - a.y) * 0.12);
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const ctrl = land ? { x: mid.x, y: mid.y - bend } : { x: mid.x + bend, y: mid.y };
  const gazeD = `M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`;
  // knot of dashes on a meeting: same path structure so motion can morph it
  const knotD = land
    ? `M ${mid.x - 18} ${mid.y} C ${mid.x + 26} ${mid.y - 34} ${mid.x - 26} ${mid.y - 34} ${mid.x + 18} ${mid.y}`
    : `M ${mid.x} ${mid.y - 18} C ${mid.x + 34} ${mid.y + 26} ${mid.x + 34} ${mid.y - 26} ${mid.x} ${mid.y + 18}`;

  return (
    <div className="spread-wrap" data-avoid data-testid="spread" data-state={scene.state} data-gap={scene.gap} data-walked={scene.walked}>
      <svg className="spread-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label ?? scene.caption} data-orientation={o}>
        <defs>
          <linearGradient id={`pl${uid}`} x1="0" y1="0" x2={land ? "1" : "0"} y2={land ? "0" : "1"}>
            <stop offset="0" stopColor={skyL} stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity=".95" />
          </linearGradient>
          <linearGradient id={`pr${uid}`} x1={land ? "1" : "0"} y1={land ? "0" : "1"} x2="0" y2="0">
            <stop offset="0" stopColor={skyR} stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity=".95" />
          </linearGradient>
          <linearGradient id={`fold${uid}`} x1={land ? "0" : "0"} y1="0" x2={land ? "1" : "0"} y2={land ? "0" : "1"}>
            <stop offset="0" stopColor="#23164d" stopOpacity="0" /><stop offset=".5" stopColor="#23164d" stopOpacity=".22" /><stop offset="1" stopColor="#23164d" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`ga${uid}`}><stop offset="0" stopColor={left?.aura ?? "#fff"} stopOpacity=".9" /><stop offset="1" stopColor={left?.aura ?? "#fff"} stopOpacity="0" /></radialGradient>
          <radialGradient id={`gb${uid}`}><stop offset="0" stopColor={right?.aura ?? "#fff"} stopOpacity=".9" /><stop offset="1" stopColor={right?.aura ?? "#fff"} stopOpacity="0" /></radialGradient>
          <filter id={`sh${uid}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#23164d" floodOpacity=".28" /></filter>
        </defs>

        {/* the two pages */}
        {land ? (
          <>
            <rect x="6" y="14" width={W / 2 - 6} height={H - 28} rx="26" fill={`url(#pl${uid})`} stroke="rgba(35,22,77,.12)" />
            <rect x={W / 2} y="14" width={W / 2 - 6} height={H - 28} rx="26" fill={`url(#pr${uid})`} stroke="rgba(35,22,77,.12)" />
            <rect x={W / 2 - 26} y="14" width="52" height={H - 28} fill={`url(#fold${uid})`} />
          </>
        ) : (
          <>
            <rect x="14" y="6" width={W - 28} height={H / 2 - 6} rx="26" fill={`url(#pl${uid})`} stroke="rgba(35,22,77,.12)" />
            <rect x="14" y={H / 2} width={W - 28} height={H / 2 - 6} rx="26" fill={`url(#pr${uid})`} stroke="rgba(35,22,77,.12)" />
            <rect x="14" y={H / 2 - 26} width={W - 28} height="52" fill={`url(#fold${uid})`} />
          </>
        )}

        {/* footprints */}
        <g role="img" aria-label={`${scene.walked} of ${n} steps walked`}>
          {Array.from({ length: n }, (_, k) => {
            const pt = lane(k);
            const isFilled = k < fromLeft || k >= n - fromRight;
            const middle = k - fromLeft; // 0 is the first print inside the left walked run
            const isDrift = !isFilled && middle >= 0 && middle < drifts;
            const cls = isFilled ? "footprint-fill" : isDrift ? "footprint-drift" : "footprint-empty";
            const rot = land ? (k < n / 2 ? 90 : -90) : k < n / 2 ? 180 : 0;
            return (
              <g key={k} transform={`translate(${pt.x} ${pt.y}) rotate(${rot})`} data-print={isFilled ? "filled" : isDrift ? "drift" : "empty"}>
                <motion.g initial={false} animate={reduce ? undefined : { scale: isFilled ? [2.8, 1.9] : 1.9 }} transition={{ duration: 0.35 }} style={{ scale: 1.9 }}>
                  <Footprint className={cls} flip={k % 2 === 1} />
                </motion.g>
              </g>
            );
          })}
        </g>

        {/* the gaze line, drawn in on load: a dashed line revealed by a mask whose stroke draws itself */}
        <mask id={`gm${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <motion.path
            d={met ? knotD : gazeD}
            fill="none" stroke="#fff" strokeWidth="24" strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ d: met ? knotD : gazeD, pathLength: 1 }}
            transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        </mask>
        <g mask={`url(#gm${uid})`}>
          <motion.path
            d={met ? knotD : gazeD}
            fill="none" stroke="#23164d" strokeOpacity=".28" strokeLinecap="round"
            strokeWidth={scene.gazeLaser ? 8 : 6.5}
            strokeDasharray={scene.gazeDashed ? "1 12" : "1 8"}
            initial={false}
            animate={{ d: met ? knotD : gazeD }}
            transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.path
            d={met ? knotD : gazeD}
            className="gaze-line"
            data-testid="gaze-line"
            stroke={scene.gazeColor}
            strokeWidth={scene.gazeLaser ? 5.5 : 4.5}
            strokeDasharray={scene.gazeDashed ? "1 12" : "1 8"}
            initial={false}
            animate={{ d: met ? knotD : gazeD, opacity: scene.state === "waiting" ? 0.35 : 1 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: scene.state === "today-both" || met ? `drop-shadow(0 0 8px ${scene.gazeColor})` : undefined }}
          />
        </g>
        {/* lantern hangs at the fold when one is stored */}
        {scene.lantern && (
          <g transform={land ? `translate(${W / 2 - 24} 30)` : `translate(${W - 90} ${H / 2 - 40})`} data-testid="lantern">
            <circle cx="24" cy="44" r="46" fill="#ffd86b" opacity=".35" />
            <LanternIcon width={48} height={60} />
          </g>
        )}

        <Disc side={left} u={uLeft} centre={centre} S={S} uid={`${uid}a`} glow={`url(#ga${uid})`} apart={apart} hand="left" stepSignal={stepSignal} reduce={!!reduce} land={land} />
        {right ? (
          <Disc side={right} u={uRight} centre={centre} S={S} uid={`${uid}b`} glow={`url(#gb${uid})`} apart={apart} hand="right" stepSignal={stepSignal} reduce={!!reduce} land={land} />
        ) : (
          <EmptyChair c={centre(uRight)} S={S} hint={inviteHint} />
        )}

        {met && postmark && (
          <motion.g
            data-testid="postmark"
            style={{ color: "#c0366c", transformOrigin: `${W / 2}px ${land ? H * 0.2 : H * 0.5}px` }}
            initial={reduce ? false : { scale: 2.6, rotate: -22, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 0.92 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <g transform={`translate(${W / 2 - 80} ${land ? H * 0.2 - 80 : H * 0.5 - 80})`}><Postmark text={postmark} size={160} /></g>
          </motion.g>
        )}
        {stepSignal > 0 && !reduce && <Burst key={stepSignal} at={{ x: W / 2, y: land ? H * 0.46 : H * 0.5 }} />}
      </svg>
      <p className="spread-caption mono muted" data-testid="spread-caption" aria-live="polite">{scene.caption}</p>
    </div>
  );
}

function Disc({ side, u, centre, S, glow, apart, hand, stepSignal, reduce, land }: {
  side: Side | null; u: number; centre: (u: number) => { x: number; y: number }; S: number; uid: string; glow: string;
  apart: boolean; hand: "left" | "right"; stepSignal: number; reduce: boolean; land: boolean;
}) {
  const c = centre(u);
  const tx = c.x - S / 2;
  const ty = c.y - S / 2;
  // hop one footprint when a step lands: y keyframes only when the signal changed since the last render
  const seen = useRef(stepSignal);
  const hop = !reduce && seen.current !== stepSignal;
  useEffect(() => { seen.current = stepSignal; }, [stepSignal]);
  if (!side) return null;
  const chog = getChog(side.tokenId);
  const tilt = hand === "left" ? -3 : 3;
  const turn = apart ? (hand === "left" ? -10 : 10) : tilt;
  const flip = apart ? -1 : 1;
  return (
    <motion.g
      initial={{ x: tx, y: ty }}
      animate={{ x: tx, y: hop ? [ty, ty - 34, ty] : ty }}
      transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      data-testid={`disc-${hand}`}
      data-token={side.tokenId}
    >
      <circle cx={S / 2} cy={S / 2} r={S * 0.68} fill={glow} opacity={side.light} />
      <g transform={`translate(${S / 2} ${S / 2}) rotate(${turn}) scale(${flip} 1) translate(${-S / 2} ${-S / 2})`} style={{ opacity: apart ? 0.78 : 1 }}>
        <foreignObject x={-8} y={-8} width={S + 16} height={S + 16}>
          <div className="sticker" style={{ width: S + 16, height: S + 16, boxSizing: "border-box" }}>
            <ChogImg id={side.tokenId} eager />
          </div>
        </foreignObject>
      </g>
      {side.accessory && <AccessoryBag kind={side.accessory} x={hand === "left" ? S - 10 : 6} y={S + 6} />}
      <foreignObject x={-20} y={S + 18} width={S + 40} height={34}>
        <div className={`mono tag ${chog?.gaze === 1 ? "left" : chog?.gaze === 2 ? "right" : "front"}`} style={{ justifyContent: "center", whiteSpace: "nowrap", fontSize: land ? ".72rem" : ".7rem" }}>
          {chogLabel(side.tokenId)}
        </div>
      </foreignObject>
    </motion.g>
  );
}
/** A little bag at the Chog's feet. The accessory trait sits inside. Weather only, never a rule. */
function AccessoryBag({ kind, x, y }: { kind: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-label={`bag with ${kind}`}>
      <path d="M2 8h30l-3 24H5z" fill="#f6e9c7" stroke="#23164d" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M10 8c0-7 14-7 14 0" fill="none" stroke="#23164d" strokeWidth="2.5" />
      <text x="17" y="26" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="#23164d">{kind.slice(0, 4).toUpperCase()}</text>
    </g>
  );
}

function EmptyChair({ c, S, hint }: { c: { x: number; y: number }; S: number; hint?: string }) {
  return (
    <g transform={`translate(${c.x - S / 2} ${c.y - S / 2})`} data-testid="empty-chair">
      <rect x="0" y="0" width={S} height={S} rx="26" fill="rgba(255,255,255,.55)" stroke="#6c4ab6" strokeWidth="3" strokeDasharray="10 9" />
      <path d={`M${S * 0.36} ${S * 0.3}v${S * 0.28}h${S * 0.28}v-${S * 0.28}`} fill="none" stroke="#6c4ab6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${S * 0.32} ${S * 0.58}h${S * 0.36}M${S * 0.38} ${S * 0.58}v${S * 0.2}M${S * 0.62} ${S * 0.58}v${S * 0.2}`} fill="none" stroke="#6c4ab6" strokeWidth="5" strokeLinecap="round" />
      <foreignObject x={-24} y={S + 14} width={S + 48} height={52}>
        <div className="mono muted" style={{ textAlign: "center", lineHeight: 1.3 }}>{hint ?? "An empty chair. Your friend's Chog goes here."}</div>
      </foreignObject>
    </g>
  );
}

/** 900 ms of tiny paper stamps when a step lands. Transform and opacity only. */
function Burst({ at }: { at: { x: number; y: number } }) {
  const bits = Array.from({ length: 14 }, (_, i) => i);
  const colors = ["#836ef9", "#ff7aa8", "#ffbf3c", "#3fbf8f", "#6c4ab6"];
  return (
    <g pointerEvents="none" aria-hidden>
      {bits.map((i) => {
        const ang = (i / bits.length) * Math.PI * 2;
        return (
          <motion.rect
            key={i} x={at.x - 5} y={at.y - 6} width="10" height="12" rx="2" fill={colors[i % colors.length]}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ x: Math.cos(ang) * (90 + (i % 3) * 30), y: Math.sin(ang) * (70 + (i % 4) * 20) - 20, opacity: 0, rotate: 180 + i * 20, scale: 0.6 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </g>
  );
}
