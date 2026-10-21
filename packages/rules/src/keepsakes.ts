// Keepsakes: small stamps a walk earns. Derived from the walk and its events only (never stored), so the
// verifier and the UI always agree. Each keepsake is a die-cut stamp in the UI (components/chog/Stamp.tsx).
import type { Event, Walk } from "./engine";
import { MET } from "./engine";

export type KeepsakeId =
  | "first-step"
  | "first-note"
  | "three-in-a-row"
  | "lantern-received"
  | "kept-by-a-lantern"
  | "met-7"
  | "met-14"
  | "met-30"
  | "holders-seal";

export interface Keepsake {
  id: KeepsakeId;
  title: string;
  line: string;
}

export const KEEPSAKE_COPY: Record<KeepsakeId, { title: string; line: string }> = {
  "first-step": { title: "First step", line: "You both showed up on the same day and the Chogs moved." },
  "first-note": { title: "First note", line: "You left a note with your show-up." },
  "three-in-a-row": { title: "Three in a row", line: "Three kept days without a break." },
  "lantern-received": { title: "Lantern received", line: "Someone burned $CHOG so a day would count for you." },
  "kept-by-a-lantern": { title: "Kept by a lantern", line: "A lantern kept a day only one of you made." },
  "met-7": { title: "Met at 7", line: "A seven day walk, finished." },
  "met-14": { title: "Met at 14", line: "A fourteen day walk, finished." },
  "met-30": { title: "Met at 30", line: "A thirty day walk, finished." },
  "holders-seal": { title: "Holder's seal", line: "You held your Chog when the walk began." },
};

const make = (id: KeepsakeId): Keepsake => ({ id, ...KEEPSAKE_COPY[id] });

/**
 * Keepsakes for one person on one walk.
 * @param walk the walk as read from the contract (or the engine)
 * @param who the person's wallet
 * @param events the walk's events in order (from logs, or from the engine in Demo)
 */
export function keepsakesFor(walk: Walk, who: string, events: Event[]): Keepsake[] {
  const me = who.toLowerCase();
  const isA = walk.walkerA.toLowerCase() === me;
  const isB = walk.walkerB.toLowerCase() === me;
  if (!isA && !isB) return [];
  const out: KeepsakeId[] = [];
  const mine = events.filter((e) => e.walkId === walk.id);

  if (mine.some((e) => e.name === "Stepped")) out.push("first-step");

  const wroteNote = mine.some((e) => {
    if (e.name !== "ShowedUp") return false;
    const d = e.data as { walker?: string; note?: string } | undefined;
    return !!d && (d.walker ?? "").toLowerCase() === me && !!d.note && d.note !== "joined" && d.note.replace(/\0/g, "") !== "";
  });
  if (wroteNote) out.push("first-note");

  // three kept days in a row: consecutive Stepped days, or a day closed with a lantern, back to back
  const kept = new Set<number>();
  for (const e of mine) {
    const d = e.data as { day?: number; lanternUsed?: boolean } | undefined;
    if (e.name === "Stepped" && d?.day !== undefined) kept.add(d.day);
    if (e.name === "DayClosed" && d?.lanternUsed && d.day !== undefined) kept.add(d.day);
  }
  const days = [...kept].sort((a, b) => a - b);
  let run = 1;
  let best = days.length ? 1 : 0;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  if (best >= 3) out.push("three-in-a-row");

  const lit = mine.some((e) => e.name === "LanternLit");
  if (lit) out.push("lantern-received");
  if (walk.lanternsUsed > 0) out.push("kept-by-a-lantern");

  if (walk.status === MET) {
    out.push(walk.distance === 7 ? "met-7" : walk.distance === 14 ? "met-14" : "met-30");
  }
  if ((isA && walk.sealA) || (isB && walk.sealB)) out.push("holders-seal");
  return out.map(make);
}
