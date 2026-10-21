import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const PowerIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...p}><path d="M12 3v8" /><path d="M6.4 6.6a8 8 0 1 0 11.2 0" /></svg>
);
export const IconWalk = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M5 19c3-1 4-5 7-5s4 4 7 5" /><circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" /><path d="M10.6 8h2.8" strokeDasharray="1 3" /></svg>
);
export const IconMe = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h5" /></svg>
);
export const IconHeart = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M3 12h4l2-5 3 10 2-5h7" /></svg>
);
export const IconProof = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconDemo = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="8.5" /><path d="m10 8.5 5 3.5-5 3.5z" /></svg>
);

/** One footprint: an oval sole and five toes, drawn in one stroke family. */
export function Footprint({ className, style, flip = false }: { className?: string; style?: React.CSSProperties; flip?: boolean }) {
  return (
    <g className={className} style={style} transform={flip ? "scale(-1 1)" : undefined}>
      <ellipse cx="0" cy="3" rx="5.2" ry="7.2" />
      <circle cx="-4.6" cy="-8.2" r="1.9" /><circle cx="-1.4" cy="-10.4" r="1.9" /><circle cx="2" cy="-10.4" r="1.9" /><circle cx="5" cy="-8.2" r="1.7" />
    </g>
  );
}

export const LanternIcon = ({ lit = true, ...p }: P & { lit?: boolean }) => (
  <svg viewBox="0 0 64 80" width="64" height="80" aria-hidden {...p}>
    <path d="M32 4v8" stroke="#23164d" strokeWidth="3" strokeLinecap="round" />
    <rect x="22" y="10" width="20" height="7" rx="3" fill="#6c4ab6" stroke="#23164d" strokeWidth="3" />
    <path d="M18 24c0-5 6-7 14-7s14 2 14 7v26c0 7-6 10-14 10s-14-3-14-10z" fill={lit ? "#ffd86b" : "#f3eefe"} stroke="#23164d" strokeWidth="3" />
    <path d="M25 22v36M39 22v36" stroke="#23164d" strokeWidth="2" opacity=".35" />
    {lit && <ellipse cx="32" cy="40" rx="7" ry="11" fill="#fff6c9" />}
    <rect x="24" y="60" width="16" height="7" rx="3" fill="#6c4ab6" stroke="#23164d" strokeWidth="3" />
    <path d="M32 67v7" stroke="#23164d" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const PledgeJar = (p: P) => (
  <svg viewBox="0 0 80 90" width="80" height="90" aria-hidden {...p}>
    <rect x="22" y="4" width="36" height="10" rx="4" fill="#6c4ab6" stroke="#23164d" strokeWidth="3" />
    <path d="M18 18h44c4 0 6 3 6 7v44c0 9-7 14-16 14H28c-9 0-16-5-16-14V25c0-4 2-7 6-7z" fill="#fff" stroke="#23164d" strokeWidth="3" />
    <path d="M14 50h52v19c0 8-6 13-15 13H29c-9 0-15-5-15-13z" fill="#ffe9b0" opacity=".9" />
    <circle cx="34" cy="62" r="6" fill="#ffbf3c" stroke="#23164d" strokeWidth="2.5" /><circle cx="48" cy="68" r="6" fill="#ffbf3c" stroke="#23164d" strokeWidth="2.5" />
    <path d="M40 36v10M36 41h8" stroke="#6c4ab6" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export function LuggageTag({ children, tone = "left" }: { children: React.ReactNode; tone?: "left" | "right" | "front" }) {
  const fill = tone === "left" ? "#efe9ff" : tone === "right" ? "#ffe8f1" : "#fff3d1";
  return (
    <span className="luggage" style={{ ["--tag" as string]: fill }}>
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><circle cx="12" cy="12" r="5" fill="#fff" stroke="#23164d" strokeWidth="2" /></svg>
      {children}
    </span>
  );
}

/** Die-cut stamp: perforated edge, one illustration, one label. */
export function Stamp({ children, label, tone = "#6c4ab6", size = 132 }: { children: React.ReactNode; label: string; tone?: string; size?: number }) {
  const id = `perf-${label.replace(/\W/g, "")}`;
  return (
    <figure className="stamp" style={{ width: size, margin: 0 }}>
      <svg viewBox="0 0 120 140" width={size} height={size * 140 / 120} role="img" aria-label={label}>
        <defs>
          <mask id={id}>
            <rect width="120" height="140" fill="#fff" />
            {Array.from({ length: 9 }, (_, i) => <circle key={`t${i}`} cx={6 + i * 13.5} cy="0" r="4" fill="#000" />)}
            {Array.from({ length: 9 }, (_, i) => <circle key={`b${i}`} cx={6 + i * 13.5} cy="140" r="4" fill="#000" />)}
            {Array.from({ length: 10 }, (_, i) => <circle key={`l${i}`} cx="0" cy={6 + i * 14} r="4" fill="#000" />)}
            {Array.from({ length: 10 }, (_, i) => <circle key={`r${i}`} cx="120" cy={6 + i * 14} r="4" fill="#000" />)}
          </mask>
        </defs>
        <g mask={`url(#${id})`}>
          <rect width="120" height="140" fill="#fff" />
          <rect x="9" y="9" width="102" height="122" rx="4" fill="none" stroke={tone} strokeWidth="2" />
          <g transform="translate(60 62)">{children}</g>
          <text x="60" y="121" textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize="9" letterSpacing="1" fill={tone}>{label.toUpperCase()}</text>
        </g>
      </svg>
    </figure>
  );
}

/** Two rings with curved mono text, thumps down on a meeting. */
export function Postmark({ text, size = 150, className }: { text: string; size?: number; className?: string }) {
  const id = `pm-${text.replace(/\W/g, "").slice(0, 12)}`;
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} className={className} role="img" aria-label={text}>
      <defs><path id={id} d="M80 80m-56 0a56 56 0 1 1 112 0a56 56 0 1 1-112 0" /></defs>
      <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="80" cy="80" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
      <text fontFamily="var(--font-mono), monospace" fontSize="10.5" letterSpacing="2.2" fill="currentColor"><textPath href={`#${id}`} startOffset="0">{text.toUpperCase()}</textPath></text>
      <path d="M62 82q6 8 18 0t18 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58 70l8 6M102 70l-8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function FolioLine({ issue = "ISSUE 01", extra }: { issue?: string; extra?: string }) {
  return (
    <div className="folio mono" aria-label="Folio">
      <span>{issue}</span><span>CHOGTOBER 2026</span><span>MONAD MAINNET</span>{extra && <span>{extra}</span>}
    </div>
  );
}