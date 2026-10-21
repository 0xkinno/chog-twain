// Seeds the local chain with one walk in every state, for the Playwright layout matrix and state fixtures.
// Writes tests/e2e/.seed.json { open, walking, drifted, lantern, met, apart, ... walk ids }.
// Order matters: time-travelling walks first, the three that must stay "today" last.
import { mkdirSync, writeFileSync } from "node:fs";
import { lists, makeApi, warpDays } from "./lib/local.mjs";

const { L, R } = lists();
const api = makeApi();
const pickL = (n) => L[40 + n];
const pickR = (n) => R[40 + n];
const seed = {};

// apart: nobody comes for four days
let w = await api.open(1, pickL(0), 7);
await api.join(2, w, pickR(0));
await warpDays(4);
await api.send(3, "poke", [BigInt(w)]);
seed.apart = w;

// met: seven shared days (distance 7), with a pledge and a note on day 1
w = await api.open(1, pickL(1), 7, 700n * 10n ** 18n);
await api.join(2, w, pickR(1), 700n * 10n ** 18n);
await api.up(1, w, "0x" + Buffer.from("landed in Leipzig").toString("hex").padEnd(56, "0"));
for (let d = 1; d < 7; d++) { await warpDays(1); await api.up(1, w); await api.up(2, w); }
seed.met = w;

// drifted: arjun misses day 2; lena shows up on day 3, which closes day 2
w = await api.open(1, pickL(2), 14, 1400n * 10n ** 18n);
await api.join(2, w, pickR(2), 1400n * 10n ** 18n);
await api.up(1, w);
await warpDays(1);
await api.up(1, w);
await warpDays(1);
await api.up(1, w);
seed.drifted = w;

// the three that stay "today": open, walking (both here), lantern (stored)
seed.open = await api.open(4, pickL(3), 7);
w = await api.open(1, pickL(4), 7);
await api.join(2, w, pickR(4));
await api.up(1, w); // both here: a step
seed.walking = w;
w = await api.open(5, pickL(5), 14);
await api.join(6, w, pickR(5));
await api.light(3, w);
seed.lantern = w;
seed.tokens = { openChog: pickL(3), walkingA: pickL(4), walkingB: pickR(4) };

mkdirSync("tests/e2e", { recursive: true });
writeFileSync("tests/e2e/.seed.json", JSON.stringify(seed, null, 2));
console.log("seeded", seed);