// sceneFor(walk, traitsA, traitsB, day) -> Scene: a pure function. Same inputs, same scene, so the verifier
// can recompute it and the Demo and the live page always draw the same picture.
// Traits set the weather, never the rules: Aura tints the light, Background blends the sky, laser Eyes colour
// the gaze line, Accessory sits in a little bag at the Chog's feet. Gaze alone decides who may meet.
import { APART, CANCELLED, FRONT, LEFT, MET, OPEN, RIGHT, WALKING, type Walk } from "./engine";

export interface Traits {
  Aura?: string;
  Background?: string;
  Eyes?: string;
  Accessory?: string;
  Tier?: string;
  [k: string]: string | undefined;
}

export type SceneState = "waiting" | "walking" | "today-you" | "today-them" | "today-both" | "drifted" | "lantern" | "met" | "apart" | "cancelled";

export interface Footprint {
  index: number;
  filled: boolean;
  /** a dotted backward print: a step that was taken back by a missed day */
  drift: boolean;
}

export interface Side {
  tokenId: number;
  /** which page: the right-facing Chog stands on the left page and the other way round */
  page: "left" | "right";
  /** 0 = at its own page edge, 1 = at the fold */
  progress: number;
  aura: string;
  accessory: string | null;
  light: number;
}

export interface Scene {
  state: SceneState;
  gap: number;
  distance: number;
  walked: number;
  footprints: Footprint[];
  a: Side | null;
  b: Side | null;
  sky: [string, string];
  gazeColor: string;
  gazeDashed: boolean;
  gazeLaser: boolean;
  lantern: boolean;
  postmark: boolean;
  caption: string;
}

const PALETTE = ["#c9b8ff", "#ffd1e3", "#bfeee0", "#ffe9b0", "#cfe6ff", "#f6e9c7", "#e3d4ff", "#ffd9c2"];
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const fallback = (s: string) => PALETTE[hash(s) % PALETTE.length];

export const AURA_TINT: Record<string, string> = {
  "Aqua Aura": "#8fe3f2", "Royal Blue Aura": "#7f9bff", "Light Purple": "#d2b6ff", "Cool Aura": "#a9d8ff", Purple: "#a777ff",
  Wind: "#d6f3ee", Fire: "#ff9a5a", Clean: "#ffffff", "Royal Aura": "#8f7cf5", Violet: "#9b6bff", Smoke: "#c7c3d6",
  "Rose Aura": "#ff9cc2", "Burning Aura": "#ff7a45", "Pink Mist": "#ffc2dc", "Fiery Aura": "#ff8a3d", Mint: "#a5ecc9",
  "Yellow Aura": "#ffe27a", "Rose Scent": "#ffb3cf", "Electric Shock": "#e8f26a", "White Aura": "#ffffff", "Green Aura": "#8be59a",
  "Royal Blue": "#6f8bff",
};

export const BACKGROUND_SKY: Record<string, string> = {
  "Deep Aqua": "#8fd8e0", Sunlight: "#ffe9a8", Rosie: "#ffc6d6", "Sky Blue": "#bfe3ff", Mon: "#cdbfff", "Aqua Mint": "#b7efe0",
  "Coral Pink": "#ffb7a8", "Light Magenta": "#f3b9ee", "Rosy Pink": "#ffcfdc", Lemon: "#f7f1a3", Mint: "#c4f1d8", "Fresh Green": "#c2eba7",
  "Light Purple": "#d9c8ff", Aqua: "#a6e9f2", "Soft Lavender": "#e4d9ff", "Lemon Yellow": "#fbec8f", "Peach Pink": "#ffd1bd",
  "Lime Green": "#d4f08c", Radioactive: "#c8ff6b", "Deep Blue": "#7fa4e8", "Noble Blue": "#8aa6f0", "Red Sky": "#ff9c8a",
  "Afternoon Orange": "#ffc58a", "Deep Purple": "#a58cf0", Gold: "#ffd86b", "Royal Blue": "#7d92f2", "Bright Yellow": "#ffec6b",
  Magenta: "#ee8fe0", "Blood Red": "#e8776f", "Aqua Blue": "#8fd0f0", "Rose Pink": "#ffb3cb", "Supreme Purple": "#9d84ee",
};

export const LASER_COLOR: Record<string, string> = {
  "Green laser": "#3fd16f", "Purple laser": "#a259ff", "fire laser": "#ff6a3d", "cyan laser": "#2fd6e8",
};

export const ACCESSORY_BAG: Record<string, string> = {
  Fwog: "frog", Coin: "coin", Cigar: "cigar", Heart: "heart", Knife: "knife", "Red Candle": "candle-red", "Green Candle": "candle-green", SB: "sb", PEPE: "pepe",
};

export const auraTint = (a?: string) => (a ? AURA_TINT[a] ?? fallback(a) : "#ffffff");
export const skyTint = (b?: string) => (b ? BACKGROUND_SKY[b] ?? fallback(b) : "#e4d9ff");
export const accessoryOf = (a?: string) => (a ? ACCESSORY_BAG[a] ?? null : null);

function mix(a: string, b: string): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round((v + pb[i]) / 2).toString(16).padStart(2, "0")).join("");
}

/** Which page each Chog stands on. Right-facing on the left page, left-facing on the right page. */
export function pages(gazeA: number, gazeB: number): { a: "left" | "right"; b: "left" | "right" } {
  const side = (g: number, other: number): "left" | "right" => {
    if (g === RIGHT) return "left";
    if (g === LEFT) return "right";
    // a 1:1 stands where its partner's gaze points: a left-looker looks to the left page
    return other === LEFT ? "left" : "right";
  };
  const a = side(gazeA, gazeB);
  const b = side(gazeB, gazeA);
  if (a === b) return a === "left" ? { a: "left", b: "right" } : { a: "right", b: "left" };
  return { a, b };
}

export interface SceneInput {
  walk: Walk;
  gazeA: number;
  gazeB: number;
  traitsA: Traits;
  traitsB: Traits;
  /** the wallet looking at the page, to say "you are here" */
  viewer?: string;
  day: number;
}

export function sceneFor(i: SceneInput): Scene {
  const { walk: w, day } = i;
  const pg = pages(i.gazeA, w.chogB ? i.gazeB : i.gazeA === LEFT ? RIGHT : LEFT);
  const t = w.distance ? 1 - w.gap / w.distance : 0;
  const walkedSteps = Math.max(0, w.distance - w.gap);
  const footprints: Footprint[] = Array.from({ length: w.distance }, (_, k) => ({ index: k, filled: k < walkedSteps, drift: false }));
  // a drift shows once, as a dotted backward print just past the last filled print
  if (w.status === WALKING || w.status === APART) {
    const lost = Math.max(0, w.steps - walkedSteps);
    for (let k = 0; k < Math.min(lost, w.distance - walkedSteps); k++) footprints[walkedSteps + k].drift = true;
  }
  const met = w.status === MET;
  const aura = (tr: Traits) => auraTint(tr.Aura);
  const mk = (id: number, page: "left" | "right", tr: Traits): Side => ({
    tokenId: id,
    page,
    progress: met ? 1 : t,
    aura: aura(tr),
    accessory: accessoryOf(tr.Accessory),
    light: tr.Aura ? 0.55 : 0.2,
  });
  const a = w.chogA ? mk(w.chogA, pg.a, i.traitsA) : null;
  const b = w.chogB ? mk(w.chogB, pg.b, i.traitsB) : null;

  const laser = LASER_COLOR[i.traitsA.Eyes ?? ""] ?? LASER_COLOR[i.traitsB.Eyes ?? ""];
  const sky: [string, string] = [skyTint(i.traitsA.Background), skyTint(i.traitsB.Background)];

  let state: SceneState = "walking";
  let caption = "";
  const me = (i.viewer ?? "").toLowerCase();
  const iAmA = !!me && me === w.walkerA.toLowerCase();
  const iAmB = !!me && me === w.walkerB.toLowerCase();
  if (w.status === OPEN) {
    state = "waiting";
    caption = "Waiting for a friend. The other page is an empty chair.";
  } else if (w.status === MET) {
    state = "met";
    caption = `They met after ${w.steps} shared days.`;
  } else if (w.status === APART) {
    state = "apart";
    caption = "They turned away. The steps they walked are still here.";
  } else if (w.status === CANCELLED) {
    state = "cancelled";
    caption = "This walk was cancelled before a friend joined.";
  } else {
    // walking: describe today
    const today = w.curDay === day;
    const both = today && w.aIn && w.bIn;
    if (both) {
      state = "today-both";
      caption = "Both here today. One step closer.";
    } else if (today && (w.aIn || w.bIn)) {
      const youIn = (iAmA && w.aIn) || (iAmB && w.bIn);
      const themIn = (iAmA && w.bIn) || (iAmB && w.aIn);
      state = youIn ? "today-you" : themIn ? "today-them" : "walking";
      caption = youIn ? "You are here. Your friend has not come yet." : themIn ? "Your friend is here. Waiting for you." : "One of you is here. Waiting for the other.";
    } else {
      caption = w.missStreak > 0 ? `${w.missStreak} unkept day${w.missStreak > 1 ? "s" : ""} in a row. Three and they drift apart for good.` : "Nobody here yet today.";
    }
    if (state === "walking" && w.lanterns > 0) state = "lantern";
    if (state === "lantern") caption = `${w.lanterns} lantern${w.lanterns > 1 ? "s" : ""} waiting to keep a day only one of you makes.`;
    if (!caption) caption = "Walking.";
  }

  return {
    state,
    gap: w.gap,
    distance: w.distance,
    walked: walkedSteps,
    footprints,
    a,
    b,
    sky,
    gazeColor: laser ?? mix(a?.aura ?? "#836ef9", b?.aura ?? "#ff7aa8"),
    gazeDashed: !met,
    gazeLaser: !!laser,
    lantern: w.lanterns > 0,
    postmark: met,
    caption,
  };
}

export { FRONT, LEFT, RIGHT };
