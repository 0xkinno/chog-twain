"use client";
// One colour, labelled axis, no clutter. Bars are SVG rects so the chart prints and screenshots cleanly.
export function StepsChart({ data }: { data: { day: number; steps: number }[] }) {
  const max = Math.max(4, ...data.map((d) => d.steps));
  const W = 560, H = 220, pad = { l: 34, r: 8, t: 12, b: 34 };
  const bw = (W - pad.l - pad.r) / data.length;
  const ticks = [0, Math.round(max / 2), max];
  return (
    <figure style={{ margin: 0 }} data-testid="steps-chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Steps taken per day over the last ${data.length} days; highest ${max}`}>
        {ticks.map((t) => { const y = pad.t + (1 - t / max) * (H - pad.t - pad.b); return <g key={t}><line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="rgba(35,22,77,.12)" /><text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill="#4b3d7a">{t}</text></g>; })}
        {data.map((d, i) => {
          const h = (d.steps / max) * (H - pad.t - pad.b);
          return <g key={d.day}><rect x={pad.l + i * bw + 4} y={H - pad.b - h} width={Math.max(4, bw - 8)} height={Math.max(h, d.steps ? 2 : 0)} rx="4" fill="#836ef9"><title>{`Day ${d.day}: ${d.steps} steps`}</title></rect>
            {(i % 2 === 0 || data.length < 8) && <text x={pad.l + i * bw + bw / 2} y={H - 14} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="#4b3d7a">{d.day}</text>}</g>;
        })}
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill="#4b3d7a">contract day number (day 1 is deploy day, UTC)</text>
      </svg>
    </figure>
  );
}