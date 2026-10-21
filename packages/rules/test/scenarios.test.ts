// Parity: the same fixtures/scenarios/*.json run in Foundry against the contract (contracts/test/Scenarios.t.sol).
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { apply, newWorld, EngineError, type Action, type Gaze, type World } from "../src/engine";

const E18 = 10n ** 18n;
// Chogs 1..8 look L R L R R F R L; Chog 3 is held by "holder"
const GAZES: Record<number, Gaze> = { 1: 1, 2: 2, 3: 1, 4: 2, 5: 2, 6: 3, 7: 2, 8: 1 };
const names = ["lena", "arjun", "fan", "holder", "stranger"];

interface Step { op: string; who: string; walkId: number; chog: number; distance: number; pledge: number; invitee: string; n: number; err: string }
interface Scenario { name: string; about: string; steps: Step[]; expect: Record<string, number> }

function start(): World {
  const balances: Record<string, bigint> = {};
  for (const n of names) balances[n] = 10_000n * E18;
  return newWorld({ gazes: GAZES, lanternPrice: 100n * E18, holders: { 3: "holder" }, balances });
}

function toAction(s: Step): Action | null {
  switch (s.op) {
    case "open": return { type: "open", who: s.who, chog: s.chog, distance: s.distance, pledge: BigInt(s.pledge) * E18, invitee: s.invitee || undefined };
    case "join": return { type: "join", who: s.who, walkId: s.walkId, chog: s.chog };
    case "showUp": return { type: "showUp", who: s.who, walkId: s.walkId };
    case "poke": return { type: "poke", walkId: s.walkId };
    case "leave": return { type: "leave", who: s.who, walkId: s.walkId };
    case "light": return { type: "light", who: s.who, walkId: s.walkId };
    case "cheer": return { type: "cheer", who: s.who, walkId: s.walkId };
    case "cancel": return { type: "cancel", who: s.who, walkId: s.walkId };
    case "claim": return { type: "claim", who: s.who };
    case "days": return { type: "advance", days: s.n };
  }
  throw new Error(`unknown op ${s.op}`);
}

const dir = "fixtures/scenarios";
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

describe("scenario parity with the contract", () => {
  it("has scenarios", () => expect(files.length).toBeGreaterThanOrEqual(18));
  for (const f of files) {
    const sc: Scenario = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    it(`${sc.name}: ${sc.about}`, () => {
      let w = start();
      sc.steps.forEach((s, i) => {
        const a = toAction(s)!;
        if (s.err) {
          let thrown: unknown;
          try { apply(w, a); } catch (e) { thrown = e; }
          expect(thrown, `step ${i} (${s.op}) should revert with ${s.err}`).toBeInstanceOf(EngineError);
          expect((thrown as EngineError).name_).toBe(s.err);
        } else {
          w = apply(w, a).world;
        }
      });
      const x = sc.expect;
      const wk = w.walks[1];
      expect(wk.status, "status").toBe(x.status);
      expect(wk.gap, "gap").toBe(x.gap);
      expect(wk.steps, "steps").toBe(x.steps);
      expect(wk.lanterns, "lanterns").toBe(x.lanterns);
      expect(wk.lanternsUsed, "lanternsUsed").toBe(x.lanternsUsed);
      expect(wk.missStreak, "missStreak").toBe(x.missStreak);
      expect(wk.forfeitA, "forfeitA").toBe(BigInt(x.forfeitA) * E18);
      expect(wk.forfeitB, "forfeitB").toBe(BigInt(x.forfeitB) * E18);
      expect(w.claimable.lena ?? 0n, "claimLena").toBe(BigInt(x.claimLena) * E18);
      expect(w.claimable.arjun ?? 0n, "claimArjun").toBe(BigInt(x.claimArjun) * E18);
      expect(w.burned, "burned").toBe(BigInt(x.burned) * E18);
      expect(w.meetings, "meetings").toBe(x.meetings);
      expect(w.postcards.length, "postcards").toBe(x.postcards);
    });
  }
});