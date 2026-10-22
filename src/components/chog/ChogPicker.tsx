"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ALL, chogLabel, gazeName, getChog, type ChogRow } from "@/lib/chogs";
import { activeFor, AURAS, applyFilter, emptyFilter, heldBy, HEADS, type Filter } from "@/lib/picker";
import { ChogImg } from "@/components/ui/ChogImg";
import { useClients } from "@/lib/hooks";
import { DEPLOYED } from "@/lib/contracts";

const PAGE = 48;

/**
 * Picks any of the 1,969 Chogs. Filters: gaze, aura, head, free now. When joining, only Chogs that can face the
 * opener's Chog are offered. If the wallet holds Chogs they appear first with a "Yours" badge: optional, never required.
 */
export function ChogPicker({ value, onChange, facing, title = "Pick a Chog" }: { value: number | null; onChange: (id: number) => void; facing?: number; title?: string }) {
  const { pc, address } = useClients();
  const [f, setF] = useState<Filter>({ ...emptyFilter, facing, freeOnly: DEPLOYED });
  const [shown, setShown] = useState(PAGE);
  useEffect(() => { setF((x) => ({ ...x, facing })); }, [facing]);

  const held = useQuery({ queryKey: ["held", address], queryFn: () => heldBy(pc!, address!), enabled: !!pc && !!address && DEPLOYED, staleTime: 60_000 });
  const heldSet = useMemo(() => new Set(held.data ?? []), [held.data]);
  const list = useMemo(() => applyFilter(f, {}, heldSet), [f, heldSet]);
  const visible = list.slice(0, shown);
  const ids = useMemo(() => visible.map((c) => c.id), [visible]);
  const active = useQuery({ queryKey: ["active", ids.join(",")], queryFn: () => activeFor(pc!, ids), enabled: !!pc && DEPLOYED && ids.length > 0, staleTime: 5_000 });
  const act = active.data ?? {};
  const final = f.freeOnly && DEPLOYED ? visible.filter((c) => (act[c.id] ?? 0) === 0) : visible;
  const more = useRef<HTMLButtonElement>(null);

  const chip = (g: 0 | 1 | 2 | 3, text: string) => (
    <button key={g} className="chip" aria-pressed={f.gaze === g} onClick={() => { setF({ ...f, gaze: g }); setShown(PAGE); }}>{text}</button>
  );

  return (
    <section className="stack" aria-label={title} style={{ ["--gap" as string]: "14px" }} data-testid="picker">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{title}</h3>
        <span className="mono muted" data-testid="picker-count">{list.length.toLocaleString("en-US")} Chogs{facing ? ` that look at ${chogLabel(facing)}` : ""}</span>
      </div>
      <div className="row" role="group" aria-label="Filters">
        {!facing && (<>{chip(0, "Any gaze")}{chip(1, "Looks left")}{chip(2, "Looks right")}{chip(3, "Looks at you")}</>)}
        <select className="select" style={{ width: "auto" }} aria-label="Aura" value={f.aura} onChange={(e) => { setF({ ...f, aura: e.target.value }); setShown(PAGE); }}>
          <option value="">Any aura</option>{AURAS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="select" style={{ width: "auto" }} aria-label="Head" value={f.head} onChange={(e) => { setF({ ...f, head: e.target.value }); setShown(PAGE); }}>
          <option value="">Any head</option>{HEADS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <input className="input" style={{ width: 150 }} placeholder="Token or #" aria-label="Find by token or artwork number" value={f.q} onChange={(e) => { setF({ ...f, q: e.target.value }); setShown(PAGE); }} />
        {DEPLOYED && (
          <label className="chip" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={f.freeOnly} onChange={(e) => setF({ ...f, freeOnly: e.target.checked })} /> Free now
          </label>
        )}
      </div>
      {held.data && held.data.length > 0 && <p className="notice ok" data-testid="held-note">You hold {held.data.length} Chog{held.data.length > 1 ? "s" : ""}. They are listed first. You never need one to walk.</p>}
      {list.length === 0 && <p className="notice warn">No Chog matches these filters.</p>}
      <div className="pick-grid">
        {final.map((c) => <PickTile key={c.id} c={c} selected={value === c.id} busy={(act[c.id] ?? 0) !== 0} yours={heldSet.has(c.id)} onPick={() => onChange(c.id)} />)}
      </div>
      {shown < list.length && <button ref={more} className="btn btn-ghost" onClick={() => setShown((s) => s + PAGE)}>Show more</button>}
      {value && <p className="mono" data-testid="picked">Picked: {chogLabel(value)} ({gazeName(getChog(value)?.gaze ?? 0)})</p>}
    </section>
  );
}

function PickTile({ c, selected, busy, yours, onPick }: { c: ChogRow; selected: boolean; busy: boolean; yours: boolean; onPick: () => void }) {
  const tone = c.gaze === 1 ? "left" : c.gaze === 2 ? "right" : "front";
  return (
    <button className="pick" aria-pressed={selected} disabled={busy} onClick={onPick} data-token={c.id} data-gaze={gazeName(c.gaze)} aria-label={`${chogLabel(c.id)}, looks ${gazeName(c.gaze).toLowerCase()}${busy ? ", walking now" : ""}`}>
      {yours && <span className="tag ok pick-badge mono">Yours</span>}
      <ChogImg id={c.id} thumb={256} />
      <span className="meta"><span className="mono">#{c.art}</span><span className={`tag ${tone} mono`}>{gazeName(c.gaze)}</span></span>
      {busy && <span className="mono muted" style={{ paddingInline: 2 }}>walking now</span>}
    </button>
  );
}

export const TOTAL_CHOGS = ALL.length;