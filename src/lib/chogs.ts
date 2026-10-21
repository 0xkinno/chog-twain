import table from "@/data/chogs.json";
import { facing, type Gaze } from "@rules";

export interface ChogRow {
  id: number;
  art: number;
  gaze: Gaze;
  tier: string;
  aura: string;
  head: string;
  bg: string;
  eyes: string;
  acc: string;
}

const raw = table as { imageBase: string; rows: (string | number)[][] };
export const IMAGE_BASE = raw.imageBase;
export const ALL: ChogRow[] = raw.rows.map((r) => ({
  id: r[0] as number, art: r[1] as number, gaze: r[2] as Gaze, tier: r[3] as string, aura: r[4] as string,
  head: r[5] as string, bg: r[6] as string, eyes: r[7] as string, acc: r[8] as string,
}));
const BY_ID = new Map(ALL.map((c) => [c.id, c]));
/** token id -> the file inside the art folder (never assume id equals artwork number) */
const FILE = new Map<number, string>(raw.rows.map((r) => [r[0] as number, r[9] as string]));

export const getChog = (id: number) => BY_ID.get(id);
export const artFile = (id: number) => FILE.get(id);
export const GAZES: Record<number, Gaze> = Object.fromEntries(ALL.map((c) => [c.id, c.gaze]));
export const gazeName = (g: number) => (g === 1 ? "Left" : g === 2 ? "Right" : "Front");
export const gazeWord = (g: number) => (g === 1 ? "looks left" : g === 2 ? "looks right" : "looks at you");
/** "Token 846 · CHOG #338": every label shows both numbers */
export const chogLabel = (id: number) => {
  const c = BY_ID.get(id);
  return c ? `Token ${id} \u00b7 CHOG #${c.art}` : `Token ${id}`;
};
export const canFace = (a: number, b: number) => facing(GAZES, a, b);
export const isChogId = (n: number) => Number.isInteger(n) && n >= 1 && n <= 1969;

/** Counts straight from the table (also generated into data/gaze-stats.json). */
export const GAZE_COUNTS = ALL.reduce((m, c) => ((m[c.gaze] = (m[c.gaze] ?? 0) + 1), m), {} as Record<number, number>);