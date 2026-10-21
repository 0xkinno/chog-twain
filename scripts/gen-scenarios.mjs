// Writes fixtures/scenarios/*.json: one scenario per file, in a uniform shape both runners can read.
//   TypeScript: packages/rules/test/scenarios.test.ts runs them against engine.ts
//   Solidity:   contracts/test/Scenarios.t.sol runs them against ChogTwain.sol
// The expected numbers below are written by hand from the rules in the build instruction (Part 5.2), not
// produced by either implementation, so a bug in both would still be caught.
//
// World: Chogs 1..8 look  L R L R R F R L  (1 Left, 2 Right, 3 Left (held by "holder"), 4 Right, 5 Right,
// 6 Front, 7 Right, 8 Left). Actors lena, arjun, fan, holder, stranger each start with 10,000 $CHOG.
// Lantern price 100 $CHOG. Pledge amounts are whole $CHOG.
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";

const S = (op, o = {}) => ({ op, who: "", walkId: 1, chog: 0, distance: 0, pledge: 0, invitee: "", n: 1, err: "", ...o });
const open = (who, chog, distance, pledge = 0, extra = {}) => S("open", { who, chog, distance, pledge, ...extra });
const join = (who, chog, extra = {}) => S("join", { who, chog, ...extra });
const up = (who, extra = {}) => S("showUp", { who, ...extra });
const day = (n = 1) => S("days", { n });
const light = (who, extra = {}) => S("light", { who, ...extra });
const E = (o) => ({ status: 0, gap: 0, steps: 0, lanterns: 0, lanternsUsed: 0, missStreak: 0, forfeitA: 0, forfeitB: 0, claimLena: 0, claimArjun: 0, burned: 0, meetings: 0, postcards: 0, ...o });
const OPEN = 1, WALKING = 2, MET = 3, APART = 4, CANCELLED = 5;

const together = (n) => Array.from({ length: n }, () => [day(), up("lena"), up("arjun")]).flat();

const scenarios = {
  "01-seven-days-meet": {
    about: "Seven days in which both show up make a meeting; pledges come back whole; two postcards print.",
    steps: [open("lena", 1, 7, 700), join("arjun", 2), up("lena"), ...together(6)],
    expect: E({ status: MET, gap: 0, steps: 7, claimLena: 700, claimArjun: 700, meetings: 1, postcards: 2 }),
  },
  "02-same-day-second-showup-reverts": {
    about: "One step per walk per day: a second show-up on the same day reverts with AlreadyToday.",
    steps: [open("lena", 1, 7), join("arjun", 2), up("lena"), up("lena", { err: "AlreadyToday" })],
    expect: E({ status: WALKING, gap: 6, steps: 1 }),
  },
  "03-missed-day-drifts-and-costs-the-one-who-missed": {
    about: "Arjun misses day 2: the gap grows by one and 100 of his 700 moves to Lena. Steps already walked stay.",
    steps: [open("lena", 1, 7, 700), join("arjun", 2), up("lena"), day(), up("lena"), day(), up("lena")],
    expect: E({ status: WALKING, gap: 7, steps: 1, missStreak: 1, forfeitB: 100 }),
  },
  "04-three-unkept-days-part-them": {
    about: "Three unkept days in a row end the walk: Apart, both Chogs free, pledges settled with the slices.",
    steps: [open("lena", 1, 7, 700), join("arjun", 2), up("lena"), day(4), up("lena")],
    expect: E({ status: APART, gap: 7, steps: 1, missStreak: 3, claimLena: 700, claimArjun: 700 }),
  },
  "05-lantern-keeps-a-day-only-one-came-to": {
    about: "A lantern covers a day on which exactly one person came: no drift, no forfeit.",
    steps: [open("lena", 1, 7, 700), join("arjun", 2), up("lena"), light("fan"), day(), up("lena"), day(), up("lena")],
    expect: E({ status: WALKING, gap: 6, steps: 1, lanternsUsed: 1, burned: 100 }),
  },
  "06-lantern-never-covers-an-empty-day": {
    about: "Nobody came on day 2, so the stored lantern stays and the gap drifts.",
    steps: [open("lena", 1, 7), join("arjun", 2), up("lena"), light("fan"), day(2), up("lena")],
    expect: E({ status: WALKING, gap: 7, steps: 1, lanterns: 1, missStreak: 1, burned: 100 }),
  },
  "07-lanterns-cap-at-three": {
    about: "A fourth lantern reverts with LanternsFull.",
    steps: [open("lena", 1, 7), join("arjun", 2), light("fan"), light("fan"), light("fan"), light("fan", { err: "LanternsFull" })],
    expect: E({ status: WALKING, gap: 7, steps: 0, lanterns: 3, burned: 300 }),
  },
  "08-leave-forfeits-the-whole-pledge": {
    about: "Walking away ends the walk now; the leaver's whole pledge goes to the friend.",
    steps: [open("lena", 1, 7, 700), join("arjun", 2), S("leave", { who: "arjun" })],
    expect: E({ status: APART, gap: 7, steps: 0, forfeitB: 700, claimLena: 1400, claimArjun: 0 }),
  },
  "09-both-miss-no-forfeit": {
    about: "A day nobody came costs nobody: the forfeits would cancel out.",
    steps: [open("lena", 1, 7, 700), join("arjun", 2), up("lena"), day(2), up("lena")],
    expect: E({ status: WALKING, gap: 7, steps: 1, missStreak: 1 }),
  },
  "10-only-facing-chogs-meet": {
    about: "Chog 3 also looks left, so it cannot join Chog 1 (NotFacing). The 1:1 (Chog 6) can.",
    steps: [open("lena", 1, 7), join("arjun", 3, { err: "NotFacing" }), join("arjun", 6)],
    expect: E({ status: WALKING, gap: 7, steps: 0 }),
  },
  "11-a-chog-walks-with-one-pair-at-a-time": {
    about: "Chog 1 is busy: a second open with it reverts with ChogBusy.",
    steps: [open("lena", 1, 7), join("arjun", 2), open("fan", 1, 7, 0, { err: "ChogBusy" })],
    expect: E({ status: WALKING, gap: 7 }),
  },
  "12-one-wallet-cannot-walk-with-itself": {
    about: "The opener cannot join their own walk.",
    steps: [open("lena", 1, 7), join("lena", 2, { err: "SelfWalk" })],
    expect: E({ status: OPEN, gap: 7 }),
  },
  "13-private-invite": {
    about: "A walk opened for Arjun refuses Fan with NotInvited.",
    steps: [open("lena", 1, 7, 0, { invitee: "arjun" }), join("fan", 2, { err: "NotInvited" }), join("arjun", 2)],
    expect: E({ status: WALKING, gap: 7 }),
  },
  "14-stranger-cannot-show-up": {
    about: "Only the two walkers can show up.",
    steps: [open("lena", 1, 7), join("arjun", 2), up("stranger", { err: "NotWalker" })],
    expect: E({ status: WALKING, gap: 7 }),
  },
  "15-invite-expires-and-anyone-clears-it": {
    about: "After 3 days the invite expires: join reverts with InviteExpired and anyone can cancel; the pledge is claimable.",
    steps: [open("lena", 1, 7, 700), day(4), join("arjun", 2, { err: "InviteExpired" }), S("cancel", { who: "stranger" })],
    expect: E({ status: CANCELLED, gap: 7, claimLena: 700 }),
  },
  "16-drift-makes-a-meeting-take-more-than-n-steps": {
    about: "Distance 7 with one missed day: the meeting takes 8 steps, not 7 (the fuzz finding: at least N).",
    steps: [open("lena", 1, 7), join("arjun", 2), up("lena"), day(), up("lena"), day(), up("lena"), up("arjun"), ...together(6)],
    expect: E({ status: MET, gap: 0, steps: 8, meetings: 1, postcards: 2 }),
  },
  "17-distance-30": {
    about: "A 30-day walk needs 30 shared days.",
    steps: [open("lena", 1, 30, 3000), join("arjun", 2), up("lena"), ...together(29)],
    expect: E({ status: MET, gap: 0, steps: 30, claimLena: 3000, claimArjun: 3000, meetings: 1, postcards: 2 }),
  },
  "18-claim-twice-reverts": {
    about: "After claiming, a second claim reverts with NothingToClaim.",
    steps: [open("lena", 1, 7, 700), S("cancel", { who: "lena" }), S("claim", { who: "lena" }), S("claim", { who: "lena", err: "NothingToClaim" })],
    expect: E({ status: CANCELLED, gap: 7, claimLena: 0 }),
  },
};

const dir = "fixtures/scenarios";
mkdirSync(dir, { recursive: true });
for (const f of readdirSync(dir)) rmSync(`${dir}/${f}`);
for (const [name, s] of Object.entries(scenarios)) {
  writeFileSync(`${dir}/${name}.json`, JSON.stringify({ name, about: s.about, count: s.steps.length, steps: s.steps, expect: s.expect }, null, 1) + "\n");
}
console.log(`wrote ${Object.keys(scenarios).length} scenarios`);
