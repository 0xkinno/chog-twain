import { describe, expect, it } from "vitest";
import { apply, newWorld, preview, replay, facing, EngineError, MET, WALKING, APART, type Action, type Gaze, type World } from "../src/engine";

const E18 = 10n ** 18n;
const GAZES: Record<number, Gaze> = { 1: 1, 2: 2, 3: 1, 4: 2, 5: 2, 6: 3, 7: 2, 8: 1 };
const fresh = (): World => newWorld({ gazes: GAZES, balances: { lena: 10_000n * E18, arjun: 10_000n * E18, fan: 10_000n * E18 }, holders: { 3: "holder" } });
const day = (n = 1): Action => ({ type: "advance", days: n });

describe("engine", () => {
  it("never mutates the world it was given", () => {
    const w = fresh();
    const before = JSON.stringify(w, (_, v) => (typeof v === "bigint" ? v.toString() : v));
    apply(w, { type: "open", who: "lena", chog: 1, distance: 7 });
    expect(JSON.stringify(w, (_, v) => (typeof v === "bigint" ? v.toString() : v))).toBe(before);
  });

  it("a reverting action leaves the world untouched and names the contract error", () => {
    const { world } = apply(fresh(), { type: "open", who: "lena", chog: 1, distance: 7 });
    expect(() => apply(world, { type: "join", who: "lena", walkId: 1, chog: 2 })).toThrowError(EngineError);
    try { apply(world, { type: "join", who: "arjun", walkId: 1, chog: 3 }); } catch (e) { expect((e as EngineError).name_).toBe("NotFacing"); }
  });

  it("preview equals what the chain will do (I15)", () => {
    let w = replay(fresh(), [
      { type: "open", who: "lena", chog: 1, distance: 7, pledge: 700n * E18 },
      { type: "join", who: "arjun", walkId: 1, chog: 2 },
      { type: "showUp", who: "lena", walkId: 1 },
      day(), { type: "showUp", who: "lena", walkId: 1 }, day(2),
    ]).world;
    const pv = preview(w, 1).walk;
    w = apply(w, { type: "poke", walkId: 1 }).world;
    const real = w.walks[1];
    expect(pv.gap).toBe(real.gap);
    expect(pv.missStreak).toBe(real.missStreak);
    expect(pv.forfeitB).toBe(real.forfeitB);
    expect(pv.status).toBe(real.status);
  });

  it("I1/I2: at most one step per day and a meeting needs at least `distance` steps (random attendance)", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let run = 0; run < 300; run++) {
      let w = replay(fresh(), [{ type: "open", who: "lena", chog: 1, distance: 14, pledge: 1400n * E18 }, { type: "join", who: "arjun", walkId: 1, chog: 2 }]).world;
      let together = 1;
      let maxSteps = 0;
      if (rnd() < 0.7) w = apply(w, { type: "showUp", who: "lena", walkId: 1 }).world;
      else together = 0;
      for (let d = 1; d < 60 && w.walks[1].status === WALKING; d++) {
        w = apply(w, day()).world;
        if (rnd() < 0.15 && w.walks[1].lanterns < 3) { try { w = apply(w, { type: "light", who: "fan", walkId: 1 }).world; } catch { /* the roll ended the walk: the contract reverts too */ } }
        if (w.walks[1].status !== WALKING) break;
        const a = rnd() < 0.8, b = rnd() < 0.8;
        if (a) w = apply(w, { type: "showUp", who: "lena", walkId: 1 }).world;
        if (w.walks[1].status !== WALKING) break;
        if (b) w = apply(w, { type: "showUp", who: "arjun", walkId: 1 }).world;
        if (a && b) together++;
        const x = w.walks[1];
        expect(x.steps).toBeLessThanOrEqual(together);
        expect(x.gap).toBeLessThanOrEqual(x.distance);
        expect(x.steps).toBeGreaterThanOrEqual(maxSteps);
        maxSteps = x.steps;
        if (x.status === MET) expect(x.steps).toBeGreaterThanOrEqual(x.distance);
      }
      // I9: pledges are conserved
      let owed = 0n;
      for (const v of Object.values(w.claimable)) owed += v;
      const held = w.pledgesHeld;
      const total = 10_000n * E18 * 3n;
      const balances = Object.values(w.balances).reduce((s, v) => s + v, 0n);
      expect(balances + held + owed + w.burned).toBe(total);
    }
  });

  it("holder extras follow the token: home only blocks others, a sale hands over the key", () => {
    let w = apply(fresh(), { type: "setHome", who: "holder", tokenId: 3, keep: true }).world;
    expect(() => apply(w, { type: "open", who: "lena", chog: 3, distance: 7 })).toThrowError();
    w.holders[3] = "fan";
    expect(() => apply(w, { type: "open", who: "holder", chog: 3, distance: 7 })).toThrowError();
    w = apply(w, { type: "open", who: "fan", chog: 3, distance: 7 }).world;
    expect(w.walks[1].sealA).toBe(true);
  });

  it("a Chog that met can walk again and its Friend Book remembers", () => {
    let w = replay(fresh(), [{ type: "open", who: "lena", chog: 1, distance: 7 }, { type: "join", who: "arjun", walkId: 1, chog: 2 }, { type: "showUp", who: "lena", walkId: 1 }]).world;
    for (let i = 0; i < 6; i++) w = replay(w, [day(), { type: "showUp", who: "lena", walkId: 1 }, { type: "showUp", who: "arjun", walkId: 1 }]).world;
    expect(w.walks[1].status).toBe(MET);
    expect(w.friendBook[1]).toEqual([1]);
    expect(w.friendBook[2]).toEqual([1]);
    expect(w.postcards.map((p) => p.to)).toEqual(["lena", "arjun"]);
    w = replay(w, [{ type: "open", who: "lena", chog: 1, distance: 14 }, { type: "join", who: "fan", walkId: 2, chog: 4 }]).world;
    expect(w.walks[2].status).toBe(WALKING);
  });

  it("three unkept days end a walk and release both Chogs", () => {
    const w = replay(fresh(), [{ type: "open", who: "lena", chog: 1, distance: 7 }, { type: "join", who: "arjun", walkId: 1, chog: 2 }, day(4), { type: "poke", walkId: 1 }]).world;
    expect(w.walks[1].status).toBe(APART);
    expect(w.activeWalkOf[1]).toBe(0);
    expect(w.activeWalkOf[2]).toBe(0);
  });

  it("facing(): left meets right, a 1:1 meets anyone, nothing meets itself", () => {
    expect(facing(GAZES, 1, 2)).toBe(true);
    expect(facing(GAZES, 1, 3)).toBe(false);
    expect(facing(GAZES, 2, 5)).toBe(false);
    expect(facing(GAZES, 6, 1)).toBe(true);
    expect(facing(GAZES, 6, 2)).toBe(true);
    expect(facing(GAZES, 1, 1)).toBe(false);
  });
});