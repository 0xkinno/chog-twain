"use client";
// The Demo: the same rules as the contract, running locally on packages/rules with real Chog art.
// Nothing here is on-chain. It exists so a judge with no wallet can feel the whole loop in two minutes.
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  apply, newWorld, preview, sceneFor, keepsakesFor, EngineError, MET, WALKING, APART, OPEN,
  type Action, type Event, type Traits, type World,
} from "@rules";
import { Spread } from "@/components/chog/Spread";
import { ChogPicker } from "@/components/chog/ChogPicker";
import { GlowCard } from "@/components/ui/GlowCard";
import { Stamp, FolioLine, LanternIcon } from "@/components/ui/Icons";
import { ERROR_COPY } from "@/lib/errors";
import { chogLabel, getChog, GAZES, canFace, ALL, gazeWord } from "@/lib/chogs";
import { chogAmount } from "@/lib/format";
import { postcardSvg } from "@/lib/postcard";

const E18 = 10n ** 18n;
const YOU = "0xA11CE00000000000000000000000000000000001";
const FRIEND = "0xB0B0000000000000000000000000000000000002";
const FAN = "0xFA70000000000000000000000000000000000003";
const NAMES: Record<string, string> = { [YOU]: "You", [FRIEND]: "Your friend", [FAN]: "A stranger" };

const traits = (id: number): Traits => { const c = getChog(id); return c ? { Aura: c.aura || undefined, Background: c.bg || undefined, Eyes: c.eyes || undefined, Accessory: c.acc || undefined, Tier: c.tier } : {}; };
const gz = (id: number) => getChog(id)?.gaze ?? 1;

const fresh = (): World => newWorld({ gazes: GAZES, lanternPrice: 100n * E18, balances: { [YOU]: 5000n * E18, [FRIEND]: 5000n * E18, [FAN]: 5000n * E18 } });

const say = (e: Event): string => {
  const d = (e.data ?? {}) as Record<string, unknown>;
  const who = (a: unknown) => NAMES[String(a)] ?? "Someone";
  switch (e.name) {
    case "Opened": return "You opened the walk. Your Chog is locked to it.";
    case "Joined": return "Your friend joined. Their join counts as their show-up today.";
    case "ShowedUp": return d.note === "joined" ? "" : `${who(d.walker)} showed up on day ${d.day}.`;
    case "Stepped": return `Both showed up on day ${d.day}. One step closer: ${d.gap} left.`;
    case "DayClosed": return d.lanternUsed ? `Day ${d.day} closed. A lantern kept it: no drift.` : `Day ${d.day} closed with only ${d.aIn ? "you" : "your friend"} there. The Chogs drift one step apart.`;
    case "Drifted": return `${d.days} day${Number(d.days) > 1 ? "s" : ""} nobody came. Drifted apart.`;
    case "LanternLit": return `${who(d.by)} burned ${chogAmount(d.amount as bigint)} $CHOG to light a lantern.`;
    case "Met": return `They met on day ${d.day}. Both Friend Books hold this walk. Two postcards printed.`;
    case "Apart": return d.leaver && d.leaver !== "0x0000000000000000000000000000000000000000" ? `${who(d.leaver)} walked away. The whole pledge goes to the friend.` : "Three unkept days in a row. They drifted apart for good.";
    case "Settled": return `Pledges settled: you get ${chogAmount(d.toA as bigint)}, your friend gets ${chogAmount(d.toB as bigint)} $CHOG.`;
    default: return "";
  }
};

/** Each contract error, reproduced on a throwaway world so the copy can be read and tested. */
const BREAKS: { name: keyof typeof ERROR_COPY; label: string; run: () => void }[] = (() => {
  const A = (w: World, a: Action) => apply(w, a).world;
  const open = (w: World, chog = 1, extra: Partial<Extract<Action, { type: "open" }>> = {}) => A(w, { type: "open", who: YOU, chog, distance: 7, ...extra });
  const walking = () => A(open(fresh()), { type: "join", who: FRIEND, walkId: 1, chog: 2 });
  const t = (name: keyof typeof ERROR_COPY, label: string, f: () => unknown) => ({ name, label, run: () => { f(); } });
  return [
    t("AlreadyToday", "Show up twice on the same day", () => apply(A(walking(), { type: "showUp", who: YOU, walkId: 1 }), { type: "showUp", who: YOU, walkId: 1 })),
    t("NotFacing", "Join with a Chog that looks the same way", () => apply(open(fresh()), { type: "join", who: FRIEND, walkId: 1, chog: 3 })),
    t("ChogBusy", "Pick a Chog that is already walking", () => apply(walking(), { type: "open", who: FAN, chog: 1, distance: 7 })),
    t("SelfWalk", "Join your own walk", () => apply(open(fresh()), { type: "join", who: YOU, walkId: 1, chog: 2 })),
    t("NotWalker", "A stranger tries to show up", () => apply(walking(), { type: "showUp", who: FAN, walkId: 1 })),
    t("LanternsFull", "Light a fourth lantern", () => { let w = walking(); for (let i = 0; i < 3; i++) w = A(w, { type: "light", who: FAN, walkId: 1 }); return apply(w, { type: "light", who: FAN, walkId: 1 }); }),
    t("NotInvited", "Join a walk opened for someone else", () => apply(open(fresh(), 1, { invitee: FRIEND }), { type: "join", who: FAN, walkId: 1, chog: 2 })),
    t("InviteExpired", "Join an invite older than 3 days", () => apply(A(open(fresh()), { type: "advance", days: 4 }), { type: "join", who: FRIEND, walkId: 1, chog: 2 })),
    t("StillOpen", "Cancel someone else's open walk", () => apply(open(fresh()), { type: "cancel", who: FAN, walkId: 1 })),
    t("NothingToClaim", "Claim with nothing settled", () => apply(fresh(), { type: "claim", who: YOU })),
    t("NotOpen", "Join a walk that already started", () => apply(walking(), { type: "join", who: FAN, walkId: 1, chog: 4 })),
    t("NotWalking", "Show up on a walk that ended", () => apply(A(walking(), { type: "leave", who: YOU, walkId: 1 }), { type: "showUp", who: YOU, walkId: 1 })),
    t("BadDistance", "Open a walk of 5 days", () => apply(fresh(), { type: "open", who: YOU, chog: 1, distance: 5 })),
    t("BadChog", "Pick token number 2,000", () => apply(fresh(), { type: "open", who: YOU, chog: 2000, distance: 7 })),
    t("HomeOnly", "Pick a Chog its holder keeps home", () => { const w = newWorld({ gazes: GAZES, holders: { 1: FAN } }); return apply(A(w, { type: "setHome", who: FAN, tokenId: 1, keep: true }), { type: "open", who: YOU, chog: 1, distance: 7 }); }),
    t("NotHolder", "Set home only without holding the Chog", () => apply(newWorld({ gazes: GAZES, holders: { 1: FAN } }), { type: "setHome", who: YOU, tokenId: 1, keep: true })),
    t("TransferFailed", "Pledge more $CHOG than the wallet holds", () => apply(newWorld({ gazes: GAZES, balances: { [YOU]: 1n } }), { type: "open", who: YOU, chog: 1, distance: 7, pledge: 100n * E18 })),
    t("BadProof", "Use a Chog that is not in the collection data", () => apply(newWorld({ gazes: {} }), { type: "open", who: YOU, chog: 1, distance: 7 })),
  ];
})();

export function Demo() {
  const [yours, setYours] = useState<number | null>(1);
  const [friendChog, setFriendChog] = useState<number>(846);
  const [distance, setDistance] = useState<7 | 14 | 30>(7);
  const [pledge, setPledge] = useState(false);
  const [world, setWorld] = useState<World>(fresh);
  const [events, setEvents] = useState<Event[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [err, setErr] = useState<{ name: string; text: string } | null>(null);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [picking, setPicking] = useState(false);

  const wk = world.walks[1];
  const pv = wk ? preview(world, 1) : null;
  const w = pv?.walk;
  const scene = useMemo(() => {
    if (!w) return null;
    return sceneFor({ walk: w, gazeA: gz(w.chogA), gazeB: w.chogB ? gz(w.chogB) : 0, traitsA: traits(w.chogA), traitsB: w.chogB ? traits(w.chogB) : {}, viewer: YOU, day: world.day });
  }, [w, world.day]);

  const run = (a: Action, label?: string) => {
    setErr(null);
    try {
      const before = scene?.walked ?? 0;
      const r = apply(world, a);
      setWorld(r.world);
      setEvents((e) => [...e, ...r.events]);
      const lines = r.events.map(say).filter(Boolean);
      setLog((l) => [...(label ? [label] : []), ...lines, ...l]);
      if (r.events.some((e) => e.name === "Stepped")) setStep((n) => n + 1);
      void before;
    } catch (e) {
      if (e instanceof EngineError) setErr({ name: e.name_, text: ERROR_COPY[e.name_] ?? e.name_ });
      else throw e;
    }
  };
  const act = (a: Action, label?: string) => run(a, label);

  function begin() {
    if (!yours) return;
    let wd = fresh();
    const evs: Event[] = [];
    const lines: string[] = [];
    const step1 = (a: Action) => { const r = apply(wd, a); wd = r.world; evs.push(...r.events); lines.unshift(...r.events.map(say).filter(Boolean).reverse()); };
    step1({ type: "open", who: YOU, chog: yours, distance, pledge: pledge ? 700n * E18 : 0n });
    setWorld(wd); setEvents(evs); setLog(lines); setErr(null); setStarted(true); setStep(0);
  }
  function friendJoins() { act({ type: "join", who: FRIEND, walkId: 1, chog: friendChog }); }
  const reset = () => { setWorld(fresh()); setEvents([]); setLog([]); setErr(null); setStarted(false); setStep(0); };
  const nextDay = () => { run({ type: "advance", days: 1 }, `Day ${world.day + 1} begins at 00:00 UTC.`); };
  const friendShows = () => act({ type: "showUp", who: FRIEND, walkId: 1 });
  const youShow = () => act({ type: "showUp", who: YOU, walkId: 1, note: "gm" });
  const friendMisses = () => {
    // a day your friend misses: you show up, the day turns, and the next action closes it
    let wd = world; const evs: Event[] = [];
    try {
      if (!(wd.walks[1].curDay === wd.day && wd.walks[1].aIn)) { const r = apply(wd, { type: "showUp", who: YOU, walkId: 1 }); wd = r.world; evs.push(...r.events); }
      let r = apply(wd, { type: "advance", days: 1 }); wd = r.world;
      r = apply(wd, { type: "poke", walkId: 1 }); wd = r.world; evs.push(...r.events);
      setWorld(wd); setEvents((e) => [...e, ...evs]); setLog((l) => [...evs.map(say).filter(Boolean).reverse(), "Your friend does not come.", ...l]); setErr(null);
    } catch (e) { if (e instanceof EngineError) setErr({ name: e.name_, text: ERROR_COPY[e.name_] }); else throw e; }
  };
  const lantern = () => act({ type: "light", who: FAN, walkId: 1 });
  const leave = () => act({ type: "leave", who: YOU, walkId: 1 });
  const claim = () => act({ type: "claim", who: YOU });
  const auto = () => {
    // walk it all the way: both show up each day until they meet (a few steps at a time, shown in the log)
    let wd = world; const evs: Event[] = [];
    for (let i = 0; i < 60 && wd.walks[1].status === WALKING; i++) {
      const cur = wd.walks[1];
      if (!(cur.curDay === wd.day && cur.aIn)) wd = apply(wd, { type: "showUp", who: YOU, walkId: 1 }).world;
      const r1 = apply(wd, { type: "showUp", who: FRIEND, walkId: 1 }).world; wd = r1;
      if (wd.walks[1].status === WALKING) wd = apply(wd, { type: "advance", days: 1 }).world;
    }
    const all = replayEvents(world, wd);
    setWorld(wd); setEvents((e) => [...e, ...all]); setLog((l) => [...all.map(say).filter(Boolean).reverse(), ...l]); setErr(null); setStep((n) => n + 1);
    void evs;
  };

  const status = w?.status;
  const iShowed = !!w && w.curDay === world.day && w.aIn;
  const kept = w && yours ? keepsakesFor(wk, YOU, events) : [];
  const pc = world.postcards[0];

  return (
    <div className="page wrap stack" style={{ ["--gap" as string]: "26px" }} data-testid="demo">
      <div className="notice warn" role="note" data-testid="demo-banner"><strong>Demo.</strong> Nothing here is on-chain. It runs the same rules as the contract in your browser, with real Chog art.</div>
      <header className="stack" style={{ ["--gap" as string]: "8px" }}>
        <FolioLine extra="DEMO" />
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.6rem,6.5vw,5rem)", lineHeight: 1 }}>Try it without a wallet</h1>
        <p className="editorial" style={{ fontSize: "1.3rem", maxWidth: 680 }}>You are Lena in Leipzig. Your friend is Arjun in Pune. Show up, miss a day, light a lantern, and watch two Chogs find each other.</p>
      </header>

      {!started || !wk ? (
        <GlowCard className="flat stack" data-testid="demo-setup">
          <h2 style={{ fontSize: "1.8rem" }}>1. Pick your Chog</h2>
          <p className="muted">Any Chog works. You do not need to own it. Your friend gets one that looks at yours.</p>
          <div className="row"><span className="tag mono">{yours ? chogLabel(yours) : "none"}</span><span className="mono muted">{yours ? gazeWord(gz(yours)) : ""}</span>
            <button className="btn btn-ghost btn-small" onClick={() => setPicking((p) => !p)}>{picking ? "Close the picker" : "Choose another Chog"}</button></div>
          {picking && <ChogPicker value={yours} onChange={(id) => { setYours(id); if (!canFace(id, friendChog)) { const f = ALL.find((c) => canFace(id, c.id) && c.id !== id); if (f) setFriendChog(f.id); } setPicking(false); }} />}
          <div className="field"><span className="label">Distance</span><div className="row" role="radiogroup">{[7, 14, 30].map((d) => <button key={d} role="radio" aria-checked={distance === d} className="chip" onClick={() => setDistance(d as 7 | 14 | 30)}>{d} days</button>)}</div></div>
          <label className="chip" style={{ display: "inline-flex", gap: 8, alignItems: "center", width: "fit-content" }}><input type="checkbox" checked={pledge} onChange={(e) => setPledge(e.target.checked)} /> Pledge 700 demo $CHOG each</label>
          <button className="btn" data-testid="demo-begin" onClick={begin} disabled={!yours}>Open the walk</button>
        </GlowCard>
      ) : (
        <>
          {scene && <Spread scene={scene} stepSignal={step} postmark={status === MET ? `Chog Twain · day ${w?.endDay} · demo` : undefined} inviteHint="Your friend has not joined yet." />}

          <GlowCard className="flat stack" data-testid="demo-controls">
            <div className="row" style={{ justifyContent: "space-between" }}><h2 style={{ fontSize: "1.6rem" }}>Day {world.day}</h2><span className="tag mono" data-testid="demo-status">{status === OPEN ? "Waiting for a friend" : status === WALKING ? `Walking, ${w?.gap} apart` : status === MET ? "Met" : status === APART ? "Apart" : ""}</span></div>
            {status === OPEN && (
              <div className="stack">
                <p>Your friend's Chog must face yours. {chogLabel(friendChog)} {gazeWord(gz(friendChog))}.</p>
                <div className="row">
                  <button className="btn" data-testid="demo-join" onClick={friendJoins}>Friend joins</button>
                  <button className="btn btn-ghost" onClick={() => act({ type: "join", who: FRIEND, walkId: 1, chog: yours === 1 ? 3 : 1 })}>Friend tries a Chog that looks the same way</button>
                </div>
              </div>
            )}
            {status === WALKING && (
              <div className="row" role="group" aria-label="Demo actions">
                <button className="btn btn-big" data-testid="demo-imhere" disabled={iShowed} onClick={youShow}>{iShowed ? "You are here today" : "I'm here"}</button>
                <button className="btn" data-testid="demo-friend-shows" onClick={friendShows}>Friend shows up</button>
                <button className="btn btn-ghost" data-testid="demo-next-day" onClick={nextDay}>Next day</button>
                <button className="btn btn-ghost" data-testid="demo-friend-misses" onClick={friendMisses}>Friend misses</button>
                <button className="btn btn-pink" data-testid="demo-lantern" onClick={lantern}><LanternIcon width={18} height={22} /> Light a lantern</button>
                <button className="btn btn-ghost" data-testid="demo-leave" onClick={leave}>Walk away</button>
                <button className="btn btn-ghost" data-testid="demo-auto" onClick={auto}>Walk it all the way</button>
              </div>
            )}
            {(status === MET || status === APART) && (
              <div className="row">
                {(world.claimable[YOU] ?? 0n) > 0n && <button className="btn" data-testid="demo-claim" onClick={claim}>Claim {chogAmount(world.claimable[YOU])} $CHOG</button>}
                <button className="btn btn-ghost" onClick={reset}>Start over</button>
              </div>
            )}
            {err && <div className="notice bad" role="alert" data-testid="demo-error" data-error={err.name}><strong>{err.name}.</strong> {err.text}</div>}
            {pledge && w && <p className="mono muted" data-testid="demo-pledge">Pledge {chogAmount(w.pledge)} each {"·"} moved: {chogAmount(w.forfeitA)} from you, {chogAmount(w.forfeitB)} from your friend {"·"} lanterns {w.lanterns}/3 {"·"} burned {chogAmount(world.burned)}</p>}
          </GlowCard>

          {status === MET && pc && (
            <GlowCard className="flat stack" data-testid="demo-met">
              <h2 style={{ fontSize: "1.8rem" }}>They met</h2>
              <p>Both Friend Books now hold this walk, and each person gets a postcard. In the real app these live on-chain and cannot be sold. Friend Book of {chogLabel(pc.myChog)}: {(world.friendBook[pc.myChog] ?? []).length} meeting.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Postcard" src={`data:image/svg+xml;base64,${btoa(postcardSvg(pc.myChog, pc.theirChog, pc.distance, pc.walkId, pc.day))}`} style={{ width: "100%", maxWidth: 520, borderRadius: 14, border: "1px solid var(--line)" }} />
            </GlowCard>
          )}

          {kept.length > 0 && (
            <section className="stack" aria-label="Keepsakes"><h3>Keepsakes</h3>
              <div className="row" style={{ gap: 16 }} data-testid="demo-keepsakes">{kept.map((k) => <Stamp key={k.id} label={k.title}><circle r="24" fill="#efe9ff" stroke="#6c4ab6" strokeWidth="3" /><path d="M-12 4q6 8 12 0t12 0" fill="none" stroke="#ff7aa8" strokeWidth="3" strokeLinecap="round" /></Stamp>)}</div>
            </section>
          )}

          <GlowCard className="flat stack" style={{ ["--gap" as string]: "8px" }}>
            <h3>What happened</h3>
            <ol style={{ margin: 0, paddingLeft: "1.2rem" }} data-testid="demo-log">{log.slice(0, 14).map((l, i) => <li key={i}>{l}</li>)}</ol>
          </GlowCard>
        </>
      )}

      <GlowCard className="flat stack" data-testid="demo-breaks">
        <h3>Break a rule</h3>
        <p className="muted">Every rule the contract enforces, tried on a throwaway walk. The sentence is what the app shows before your wallet ever opens.</p>
        <BreakPanel />
      </GlowCard>
      <div className="row"><Link href="/walk/new" className="btn">Do it for real on Monad</Link><Link href="/judge" className="btn btn-ghost">60-second judge walk</Link></div>
    </div>
  );
}

function replayEvents(a: World, b: World): Event[] {
  // the auto-run changes the world in one go; summarise the milestones from the resulting state
  const out: Event[] = [];
  const w = b.walks[1];
  if (!w) return out;
  out.push({ name: "Stepped", walkId: 1, data: { day: w.curDay, gap: w.gap } });
  if (w.status === MET) out.push({ name: "Met", walkId: 1, data: { day: w.endDay } });
  if (w.status === APART) out.push({ name: "Apart", walkId: 1, data: { day: w.endDay } });
  void a;
  return out;
}

function BreakPanel() {
  const [shown, setShown] = useState<{ name: string; label: string; text: string } | null>(null);
  return (
    <div className="stack">
      <div className="row">
        {BREAKS.map((b) => (
          <button key={b.name} className="chip" data-testid={`break-${b.name}`} onClick={() => {
            try { b.run(); setShown({ name: b.name, label: b.label, text: "That worked, which is a bug." }); }
            catch (e) { setShown({ name: b.name, label: b.label, text: e instanceof EngineError ? (ERROR_COPY[e.name_] ?? e.name_) : String(e) }); }
          }}>{b.label}</button>
        ))}
      </div>
      {shown && <div className="notice bad" role="status" data-testid="break-result" data-error={shown.name}><span><strong>{shown.name}</strong> {"·"} {shown.text}</span></div>}
      <p className="mono muted">BadGaze and GazeUnknown guard the proof call itself and only fire against a forged proof on-chain.</p>
    </div>
  );
}
