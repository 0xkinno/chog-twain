import { describe, expect, it } from "vitest";
import { apply, newWorld, replay, type Gaze } from "../src/engine";
import { sceneFor, pages, auraTint, skyTint, accessoryOf } from "../src/scene";
import { keepsakesFor } from "../src/keepsakes";

const GAZES: Record<number, Gaze> = { 1: 1, 2: 2, 6: 3 };
const base = () => newWorld({ gazes: GAZES, holders: { 1: "lena" }, balances: { fan: 10n ** 21n } });
const tr = { Aura: "Fire", Background: "Mint", Eyes: "Green laser", Accessory: "Fwog" };

describe("scene", () => {
  it("puts the right-facing Chog on the left page and the left-facing on the right page", () => {
    expect(pages(1, 2)).toEqual({ a: "right", b: "left" });
    expect(pages(2, 1)).toEqual({ a: "left", b: "right" });
    expect(pages(1, 3)).toEqual({ a: "right", b: "left" }); // a 1:1 stands where its partner looks
    expect(pages(2, 3)).toEqual({ a: "left", b: "right" });
  });

  it("is deterministic: same inputs give the same scene", () => {
    const { world } = replay(base(), [{ type: "open", who: "lena", chog: 1, distance: 7 }, { type: "join", who: "arjun", walkId: 1, chog: 2 }]);
    const input = { walk: world.walks[1], gazeA: 1, gazeB: 2, traitsA: tr, traitsB: tr, day: 1, viewer: "lena" };
    expect(JSON.stringify(sceneFor(input))).toBe(JSON.stringify(sceneFor(input)));
  });

  it("maps traits to weather only: aura tint, sky, laser gaze line, accessory bag", () => {
    expect(auraTint("Fire")).toBe("#ff9a5a");
    expect(skyTint("Mint")).toBe("#c4f1d8");
    expect(accessoryOf("Fwog")).toBe("frog");
    expect(auraTint("Some New Aura")).toMatch(/^#[0-9a-f]{6}$/i); // unknown values still map, deterministically
    expect(auraTint("Some New Aura")).toBe(auraTint("Some New Aura"));
    const { world } = replay(base(), [{ type: "open", who: "lena", chog: 1, distance: 7 }, { type: "join", who: "arjun", walkId: 1, chog: 2 }]);
    const s = sceneFor({ walk: world.walks[1], gazeA: 1, gazeB: 2, traitsA: tr, traitsB: tr, day: 1 });
    expect(s.gazeLaser).toBe(true);
    expect(s.gazeColor).toBe("#3fd16f");
  });

  it("walks through every state", () => {
    const T = { Tier: "Common" };
    const mk = (actions: Parameters<typeof replay>[1], viewer = "lena", day?: number) => {
      const { world } = replay(base(), actions);
      return sceneFor({ walk: world.walks[1], gazeA: 1, gazeB: 2, traitsA: T, traitsB: T, day: day ?? world.day, viewer });
    };
    const open = { type: "open", who: "lena", chog: 1, distance: 7 } as const;
    const join = { type: "join", who: "arjun", walkId: 1, chog: 2 } as const;
    expect(mk([open]).state).toBe("waiting");
    expect(mk([open, join]).state).toBe("today-them"); // arjun joined (counts as here), lena has not
    expect(mk([open, join], "arjun").state).toBe("today-you");
    expect(mk([open, join, { type: "showUp", who: "lena", walkId: 1 }]).state).toBe("today-both");
    const s = mk([open, join, { type: "showUp", who: "lena", walkId: 1 }]);
    expect(s.walked).toBe(1);
    expect(s.footprints.filter((f) => f.filled)).toHaveLength(1);
    expect(mk([open, join, { type: "light", who: "fan", walkId: 1 }, { type: "advance", days: 1 }, { type: "poke", walkId: 1 }]).state).toBe("walking");
  });

  it("shows met with a postmark, apart and a drift print", () => {
    let { world } = replay(base(), [{ type: "open", who: "lena", chog: 1, distance: 7 }, { type: "join", who: "arjun", walkId: 1, chog: 2 }, { type: "showUp", who: "lena", walkId: 1 }]);
    const T = {};
    // one drift: gap goes back up while the walked step is remembered as a dotted print
    world = replay(world, [{ type: "advance", days: 1 }, { type: "showUp", who: "lena", walkId: 1 }, { type: "advance", days: 1 }, { type: "showUp", who: "lena", walkId: 1 }]).world;
    const drifted = sceneFor({ walk: world.walks[1], gazeA: 1, gazeB: 2, traitsA: T, traitsB: T, day: world.day });
    expect(drifted.footprints.some((f) => f.drift)).toBe(true);
    const apart = replay(world, [{ type: "leave", who: "arjun", walkId: 1 }]).world;
    expect(sceneFor({ walk: apart.walks[1], gazeA: 1, gazeB: 2, traitsA: T, traitsB: T, day: apart.day }).state).toBe("apart");
  });
});

describe("keepsakes", () => {
  it("derives stamps from the walk and its events", () => {
    let w = base();
    const ev: Parameters<typeof keepsakesFor>[2] = [];
    const run = (a: Parameters<typeof apply>[1]) => { const r = apply(w, a); w = r.world; ev.push(...r.events); };
    run({ type: "open", who: "lena", chog: 1, distance: 7 });
    run({ type: "join", who: "arjun", walkId: 1, chog: 2 });
    run({ type: "showUp", who: "lena", walkId: 1, note: "landed" });
    for (let i = 0; i < 6; i++) { run({ type: "advance", days: 1 }); run({ type: "showUp", who: "lena", walkId: 1 }); run({ type: "showUp", who: "arjun", walkId: 1 }); }
    const ids = keepsakesFor(w.walks[1], "lena", ev).map((k) => k.id);
    expect(ids).toContain("first-step");
    expect(ids).toContain("first-note");
    expect(ids).toContain("three-in-a-row");
    expect(ids).toContain("met-7");
    expect(ids).toContain("holders-seal");
    expect(keepsakesFor(w.walks[1], "arjun", ev).map((k) => k.id)).not.toContain("holders-seal");
    expect(keepsakesFor(w.walks[1], "nobody", ev)).toEqual([]);
  });
});