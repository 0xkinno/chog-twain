// Chog Twain rules engine: a pure TypeScript port of contracts/src/ChogTwain.sol.
// Used by the Demo (no wallet), by the verifier (recompute a walk from events) and by the parity fixtures
// (fixtures/scenarios/*.json run here and in Foundry; same results or CI fails).
// Every rule below carries the contract function it mirrors. Errors use the contract's custom error names.

export const LEFT = 1;
export const RIGHT = 2;
export const FRONT = 3;
export type Gaze = 1 | 2 | 3;

export const OPEN = 1;
export const WALKING = 2;
export const MET = 3;
export const APART = 4;
export const CANCELLED = 5;
export type Status = 1 | 2 | 3 | 4 | 5;

export const MAX_LANTERNS = 3;
export const MISS_LIMIT = 3;
export const INVITE_DAYS = 3;
export const MAX_CHOG_ID = 1969;
export const DISTANCES = [7, 14, 30] as const;
export const ZERO = "0x0000000000000000000000000000000000000000";

export type ErrorName =
  | "BadGaze" | "BadProof" | "GazeUnknown" | "NotFacing" | "BadChog" | "ChogBusy" | "HomeOnly" | "NotHolder"
  | "BadDistance" | "NotOpen" | "NotWalking" | "InviteExpired" | "NotInvited" | "SelfWalk" | "NotWalker"
  | "AlreadyToday" | "LanternsFull" | "StillOpen" | "TransferFailed" | "NothingToClaim";

export class EngineError extends Error {
  constructor(public readonly name_: ErrorName) {
    super(name_);
    this.name = "EngineError";
  }
}
const fail = (e: ErrorName): never => {
  throw new EngineError(e);
};

export interface Walk {
  id: number;
  chogA: number;
  chogB: number;
  status: Status;
  distance: number;
  gap: number;
  steps: number;
  lanterns: number;
  lanternsUsed: number;
  missStreak: number;
  missesA: number;
  missesB: number;
  aIn: boolean;
  bIn: boolean;
  stepped: boolean;
  sealA: boolean;
  sealB: boolean;
  openedDay: number;
  startDay: number;
  curDay: number;
  endDay: number;
  walkerA: string;
  walkerB: string;
  invitee: string;
  pledge: bigint;
  forfeitA: bigint;
  forfeitB: bigint;
}

export interface Postcard {
  id: number;
  to: string;
  walkId: number;
  myChog: number;
  theirChog: number;
  distance: number;
  day: number;
  withSeal: boolean;
}

export interface World {
  /** Current UTC day number (day 1 is deploy day). */
  day: number;
  lanternPrice: bigint;
  /** Who holds each Chog (live ownerOf). Chogs not listed are held by an unknown third party. */
  holders: Record<number, string>;
  /** gaze per token, taken from data/gaze.json (the contract proves it with a Merkle proof). */
  gazes: Record<number, Gaze>;
  /** tokens whose gaze has been proven on this world (mirrors gazeOf) */
  proven: Record<number, Gaze>;
  walks: Record<number, Walk>;
  walkCount: number;
  activeWalkOf: Record<number, number>;
  homeOnly: Record<number, boolean>;
  friendBook: Record<number, number[]>;
  walksOf: Record<string, number[]>;
  openList: number[];
  claimable: Record<string, bigint>;
  cheers: Record<number, number>;
  stepsOnDay: Record<number, number>;
  postcards: Postcard[];
  meetings: number;
  totalSteps: number;
  totalShowUps: number;
  lanternsLit: number;
  pledgesHeld: bigint;
  burned: bigint;
  /** wallet balances of $CHOG, for conservation checks in tests and the Demo */
  balances: Record<string, bigint>;
}

export type Action =
  | { type: "open"; who: string; chog: number; distance: number; pledge?: bigint; invitee?: string }
  | { type: "join"; who: string; walkId: number; chog: number }
  | { type: "cancel"; who: string; walkId: number }
  | { type: "showUp"; who: string; walkId: number; note?: string }
  | { type: "poke"; who?: string; walkId: number }
  | { type: "leave"; who: string; walkId: number }
  | { type: "light"; who: string; walkId: number }
  | { type: "cheer"; who: string; walkId: number }
  | { type: "claim"; who: string }
  | { type: "setHome"; who: string; tokenId: number; keep: boolean }
  | { type: "advance"; days: number };

export interface Event {
  name: string;
  walkId?: number;
  data?: Record<string, unknown>;
}

export interface Result {
  world: World;
  events: Event[];
}

export function newWorld(opts: {
  gazes: Record<number, Gaze>;
  lanternPrice?: bigint;
  holders?: Record<number, string>;
  balances?: Record<string, bigint>;
  day?: number;
}): World {
  return {
    day: opts.day ?? 1,
    lanternPrice: opts.lanternPrice ?? 100n * 10n ** 18n,
    holders: { ...(opts.holders ?? {}) },
    gazes: opts.gazes,
    proven: {},
    walks: {},
    walkCount: 0,
    activeWalkOf: {},
    homeOnly: {},
    friendBook: {},
    walksOf: {},
    openList: [],
    claimable: {},
    cheers: {},
    stepsOnDay: {},
    postcards: [],
    meetings: 0,
    totalSteps: 0,
    totalShowUps: 0,
    lanternsLit: 0,
    pledgesHeld: 0n,
    burned: 0n,
    balances: { ...(opts.balances ?? {}) },
  };
}

const cap8 = (v: number) => (v > 255 ? 255 : v);
const capBig = (v: bigint, max: bigint) => (v > max ? max : v);
const lc = (a: string) => a.toLowerCase();

/** mirrors canMeet: Left meets Right; a 1:1 (Front) meets anyone; a Chog never meets itself. */
export function canMeet(w: World, x: number, y: number): boolean {
  const gx = w.proven[x];
  const gy = w.proven[y];
  if (!gx || !gy) return fail("GazeUnknown");
  if (x === y) return false;
  if (gx === FRONT || gy === FRONT) return true;
  return gx !== gy;
}

/** Pure check used by the picker: can these two Chogs face each other (by published gaze data)? */
export function facing(gazes: Record<number, Gaze>, x: number, y: number): boolean {
  const gx = gazes[x];
  const gy = gazes[y];
  if (!gx || !gy || x === y) return false;
  if (gx === FRONT || gy === FRONT) return true;
  return gx !== gy;
}

function prove(w: World, chog: number) {
  const g = w.gazes[chog];
  if (!g) fail("BadProof");
  if (!w.proven[chog]) w.proven[chog] = g;
}

function pickable(w: World, who: string, chog: number): boolean {
  if (chog === 0 || chog > MAX_CHOG_ID) fail("BadChog");
  if ((w.activeWalkOf[chog] ?? 0) !== 0) fail("ChogBusy");
  const holder = w.holders[chog];
  const withSeal = !!holder && lc(holder) === lc(who);
  if (w.homeOnly[chog] && !withSeal) fail("HomeOnly");
  return withSeal;
}

function pull(w: World, from: string, amount: bigint) {
  if (amount === 0n) return;
  const bal = w.balances[from] ?? 0n;
  if (bal < amount) fail("TransferFailed");
  w.balances[from] = bal - amount;
}

function missWorld(wk: Walk, aMissed: boolean, bMissed: boolean, n: number) {
  const g = wk.gap + n;
  wk.gap = g > wk.distance ? wk.distance : g;
  wk.missStreak = cap8(wk.missStreak + n);
  const perDay = wk.pledge / BigInt(wk.distance);
  if (aMissed && !bMissed) {
    wk.missesA = cap8(wk.missesA + n);
    wk.forfeitA = capBig(wk.forfeitA + perDay * BigInt(n), wk.pledge);
  } else if (bMissed && !aMissed) {
    wk.missesB = cap8(wk.missesB + n);
    wk.forfeitB = capBig(wk.forfeitB + perDay * BigInt(n), wk.pledge);
  } else {
    wk.missesA = cap8(wk.missesA + n);
    wk.missesB = cap8(wk.missesB + n);
  }
}

function end(w: World, wk: Walk, status: Status, ev: Event[]) {
  wk.status = status;
  wk.endDay = w.day;
  w.activeWalkOf[wk.chogA] = 0;
  w.activeWalkOf[wk.chogB] = 0;
  if (wk.pledge !== 0n) {
    const toA = wk.pledge - wk.forfeitA + wk.forfeitB;
    const toB = wk.pledge - wk.forfeitB + wk.forfeitA;
    w.pledgesHeld -= wk.pledge * 2n;
    w.claimable[wk.walkerA] = (w.claimable[wk.walkerA] ?? 0n) + toA;
    w.claimable[wk.walkerB] = (w.claimable[wk.walkerB] ?? 0n) + toB;
    ev.push({ name: "Settled", walkId: wk.id, data: { toA, toB } });
  }
}

function meet(w: World, wk: Walk, ev: Event[]) {
  w.meetings++;
  (w.friendBook[wk.chogA] ??= []).push(wk.id);
  (w.friendBook[wk.chogB] ??= []).push(wk.id);
  end(w, wk, MET, ev);
  const pa = w.postcards.length + 1;
  w.postcards.push({ id: pa, to: wk.walkerA, walkId: wk.id, myChog: wk.chogA, theirChog: wk.chogB, distance: wk.distance, day: wk.endDay, withSeal: wk.sealA });
  const pb = pa + 1;
  w.postcards.push({ id: pb, to: wk.walkerB, walkId: wk.id, myChog: wk.chogB, theirChog: wk.chogA, distance: wk.distance, day: wk.endDay, withSeal: wk.sealB });
  ev.push({ name: "Met", walkId: wk.id, data: { chogA: wk.chogA, chogB: wk.chogB, day: wk.endDay, postcardA: pa, postcardB: pb } });
}

function step(w: World, wk: Walk, ev: Event[]) {
  wk.stepped = true;
  wk.missStreak = 0;
  wk.gap -= 1;
  if (wk.steps < 65535) wk.steps += 1;
  w.totalSteps++;
  w.stepsOnDay[wk.curDay] = (w.stepsOnDay[wk.curDay] ?? 0) + 1;
  ev.push({ name: "Stepped", walkId: wk.id, data: { gap: wk.gap, steps: wk.steps, day: wk.curDay } });
  if (wk.gap === 0) meet(w, wk, ev);
}

/** mirrors _roll: closes every day before today. */
function roll(w: World, wk: Walk, ev: Event[]) {
  if (wk.status !== WALKING) return;
  const d = w.day;
  if (wk.curDay >= d) return;
  if (!wk.stepped) {
    const one = wk.aIn !== wk.bIn;
    const lit = one && wk.lanterns > 0;
    if (lit) {
      wk.lanterns -= 1;
      wk.lanternsUsed += 1;
      wk.missStreak = 0;
    } else {
      missWorld(wk, !wk.aIn, !wk.bIn, 1);
    }
    ev.push({ name: "DayClosed", walkId: wk.id, data: { day: wk.curDay, aIn: wk.aIn, bIn: wk.bIn, lanternUsed: lit, gap: wk.gap } });
  }
  const empty = d - wk.curDay - 1;
  if (empty > 0) {
    const n = empty > 255 ? 255 : empty;
    missWorld(wk, true, true, n);
    ev.push({ name: "Drifted", walkId: wk.id, data: { days: n, gap: wk.gap } });
  }
  wk.curDay = d;
  wk.aIn = false;
  wk.bIn = false;
  wk.stepped = false;
  if (wk.missStreak >= MISS_LIMIT) {
    end(w, wk, APART, ev);
    ev.push({ name: "Apart", walkId: wk.id, data: { day: wk.endDay, leaver: ZERO } });
  }
}

/** mirrors _rollEnded: reverts NotWalking if the walk is not walking; true if the roll ended it. */
function rollEnded(w: World, wk: Walk, ev: Event[]): boolean {
  if (wk.status !== WALKING) fail("NotWalking");
  roll(w, wk, ev);
  return wk.status !== WALKING;
}

function removeOpen(w: World, id: number) {
  w.openList = w.openList.filter((x) => x !== id);
}

function getWalk(w: World, id: number): Walk {
  return w.walks[id] ?? blankWalk(id);
}
function blankWalk(id: number): Walk {
  return {
    id, chogA: 0, chogB: 0, status: 0 as Status, distance: 0, gap: 0, steps: 0, lanterns: 0, lanternsUsed: 0, missStreak: 0,
    missesA: 0, missesB: 0, aIn: false, bIn: false, stepped: false, sealA: false, sealB: false, openedDay: 0, startDay: 0,
    curDay: 0, endDay: 0, walkerA: ZERO, walkerB: ZERO, invitee: ZERO, pledge: 0n, forfeitA: 0n, forfeitB: 0n,
  };
}

/**
 * Applies one action. Pure: returns a new world and the events the contract would emit. Throws EngineError
 * (with the contract's custom error name) exactly where the contract reverts; the input world is untouched.
 */
export function apply(prev: World, a: Action): Result {
  const w: World = structuredClone(prev);
  const ev: Event[] = [];
  switch (a.type) {
    case "advance": {
      w.day += a.days;
      return { world: w, events: ev };
    }
    case "setHome": {
      const holder = w.holders[a.tokenId];
      if (!holder || lc(holder) !== lc(a.who)) fail("NotHolder");
      w.homeOnly[a.tokenId] = a.keep;
      ev.push({ name: "HomeSet", data: { tokenId: a.tokenId, homeOnly: a.keep } });
      return { world: w, events: ev };
    }
    case "open": {
      if (!(DISTANCES as readonly number[]).includes(a.distance)) fail("BadDistance");
      if (!w.proven[a.chog]) prove(w, a.chog);
      const withSeal = pickable(w, a.who, a.chog);
      const invitee = a.invitee ?? ZERO;
      if (lc(invitee) === lc(a.who)) fail("SelfWalk");
      const pledge = a.pledge ?? 0n;
      const id = ++w.walkCount;
      const wk: Walk = { ...blankWalk(id), chogA: a.chog, status: OPEN, distance: a.distance, gap: a.distance, sealA: withSeal, openedDay: w.day, walkerA: a.who, invitee, pledge };
      w.walks[id] = wk;
      w.activeWalkOf[a.chog] = id;
      (w.walksOf[a.who] ??= []).push(id);
      w.openList.push(id);
      if (pledge !== 0n) {
        w.pledgesHeld += pledge;
        pull(w, a.who, pledge);
      }
      ev.push({ name: "Opened", walkId: id, data: { chogA: a.chog, walkerA: a.who, distance: a.distance, pledge, invitee } });
      return { world: w, events: ev };
    }
    case "join": {
      const wk = getWalk(w, a.walkId);
      if (wk.status !== OPEN) fail("NotOpen");
      if (w.day > wk.openedDay + INVITE_DAYS) fail("InviteExpired");
      if (lc(a.who) === lc(wk.walkerA)) fail("SelfWalk");
      if (lc(wk.invitee) !== lc(ZERO) && lc(wk.invitee) !== lc(a.who)) fail("NotInvited");
      if (!w.proven[a.chog]) prove(w, a.chog);
      if (!canMeet(w, wk.chogA, a.chog)) fail("NotFacing");
      const withSeal = pickable(w, a.who, a.chog);
      wk.chogB = a.chog;
      wk.status = WALKING;
      wk.sealB = withSeal;
      wk.walkerB = a.who;
      wk.startDay = w.day;
      wk.curDay = w.day;
      wk.bIn = true;
      w.walks[a.walkId] = wk;
      w.activeWalkOf[a.chog] = a.walkId;
      (w.walksOf[a.who] ??= []).push(a.walkId);
      removeOpen(w, a.walkId);
      w.totalShowUps++;
      if (wk.pledge !== 0n) {
        w.pledgesHeld += wk.pledge;
        pull(w, a.who, wk.pledge);
      }
      ev.push({ name: "Joined", walkId: a.walkId, data: { chogB: a.chog, walkerB: a.who, day: w.day } });
      ev.push({ name: "ShowedUp", walkId: a.walkId, data: { walker: a.who, day: w.day, note: "joined" } });
      return { world: w, events: ev };
    }
    case "cancel": {
      const wk = getWalk(w, a.walkId);
      if (wk.status !== OPEN) fail("NotOpen");
      const expired = w.day > wk.openedDay + INVITE_DAYS;
      if (lc(a.who) !== lc(wk.walkerA) && !expired) fail("StillOpen");
      wk.status = CANCELLED;
      wk.endDay = w.day;
      w.activeWalkOf[wk.chogA] = 0;
      removeOpen(w, a.walkId);
      if (wk.pledge !== 0n) {
        w.pledgesHeld -= wk.pledge;
        w.claimable[wk.walkerA] = (w.claimable[wk.walkerA] ?? 0n) + wk.pledge;
      }
      ev.push({ name: "Cancelled", walkId: a.walkId });
      return { world: w, events: ev };
    }
    case "showUp": {
      const wk = getWalk(w, a.walkId);
      if (rollEnded(w, wk, ev)) return { world: w, events: ev };
      const isA = lc(a.who) === lc(wk.walkerA);
      if (!isA && lc(a.who) !== lc(wk.walkerB)) fail("NotWalker");
      if (isA ? wk.aIn : wk.bIn) fail("AlreadyToday");
      if (isA) wk.aIn = true;
      else wk.bIn = true;
      w.totalShowUps++;
      ev.push({ name: "ShowedUp", walkId: a.walkId, data: { walker: a.who, day: wk.curDay, note: a.note ?? "" } });
      if (wk.aIn && wk.bIn && !wk.stepped) step(w, wk, ev);
      return { world: w, events: ev };
    }
    case "poke": {
      const wk = getWalk(w, a.walkId);
      if (wk.status !== WALKING) fail("NotWalking");
      roll(w, wk, ev);
      return { world: w, events: ev };
    }
    case "leave": {
      const wk = getWalk(w, a.walkId);
      const isA = lc(a.who) === lc(wk.walkerA);
      if (!isA && lc(a.who) !== lc(wk.walkerB)) fail("NotWalker");
      if (rollEnded(w, wk, ev)) return { world: w, events: ev };
      if (isA) wk.forfeitA = wk.pledge;
      else wk.forfeitB = wk.pledge;
      end(w, wk, APART, ev);
      ev.push({ name: "Apart", walkId: a.walkId, data: { day: wk.endDay, leaver: a.who } });
      return { world: w, events: ev };
    }
    case "light": {
      const wk = getWalk(w, a.walkId);
      if (rollEnded(w, wk, ev)) fail("NotWalking");
      if (wk.lanterns >= MAX_LANTERNS) fail("LanternsFull");
      wk.lanterns += 1;
      w.lanternsLit++;
      pull(w, a.who, w.lanternPrice);
      w.burned += w.lanternPrice;
      ev.push({ name: "LanternLit", walkId: a.walkId, data: { by: a.who, amount: w.lanternPrice } });
      return { world: w, events: ev };
    }
    case "cheer": {
      const wk = getWalk(w, a.walkId);
      if (wk.status !== WALKING && wk.status !== OPEN) fail("NotWalking");
      w.cheers[a.walkId] = (w.cheers[a.walkId] ?? 0) + 1;
      ev.push({ name: "Cheered", walkId: a.walkId, data: { by: a.who } });
      return { world: w, events: ev };
    }
    case "claim": {
      const amount = w.claimable[a.who] ?? 0n;
      if (amount === 0n) fail("NothingToClaim");
      w.claimable[a.who] = 0n;
      w.balances[a.who] = (w.balances[a.who] ?? 0n) + amount;
      ev.push({ name: "Claimed", data: { who: a.who, amount } });
      return { world: w, events: ev };
    }
  }
}

/**
 * mirrors preview(): the walk as it stands today with past days closed, without writing anything.
 * Returns the walk and the day.
 */
export function preview(w: World, walkId: number): { walk: Walk; day: number } {
  const wk = structuredClone(getWalk(w, walkId));
  const day = w.day;
  if (wk.status !== WALKING || wk.curDay >= day) return { walk: wk, day };
  if (!wk.stepped) {
    if (wk.aIn !== wk.bIn && wk.lanterns > 0) {
      wk.lanterns -= 1;
      wk.lanternsUsed += 1;
      wk.missStreak = 0;
    } else {
      missWorld(wk, !wk.aIn, !wk.bIn, 1);
    }
  }
  const empty = day - wk.curDay - 1;
  if (empty > 0) missWorld(wk, true, true, empty > 255 ? 255 : empty);
  wk.curDay = day;
  wk.aIn = false;
  wk.bIn = false;
  wk.stepped = false;
  if (wk.missStreak >= MISS_LIMIT) wk.status = APART;
  return { walk: wk, day };
}

/** $CHOG conservation (I9): everything held by the contract is an active pledge or a claimable balance. */
export function conserved(w: World): boolean {
  let owed = 0n;
  for (const v of Object.values(w.claimable)) owed += v;
  return w.pledgesHeld >= 0n && owed >= 0n;
}

export function walkOf(w: World, id: number): Walk | undefined {
  return w.walks[id];
}

/** Human status word for UI and verifier output. */
export function statusName(s: Status): "Open" | "Walking" | "Met" | "Apart" | "Cancelled" {
  return (["Open", "Walking", "Met", "Apart", "Cancelled"] as const)[s - 1];
}

/**
 * Replays a list of actions from a fresh world and returns the final world. Used by the parity fixtures
 * (JSON scenarios) and by the offline verifier.
 */
export function replay(start: World, actions: Action[]): Result {
  let world = start;
  const events: Event[] = [];
  for (const a of actions) {
    const r = apply(world, a);
    world = r.world;
    events.push(...r.events);
  }
  return { world, events };
}
