"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { sceneFor, type Traits, type Walk, OPEN, WALKING, MET, APART, CANCELLED } from "@rules";
import { Spread } from "@/components/chog/Spread";
import { ChogPicker } from "@/components/chog/ChogPicker";
import { GlowCard } from "@/components/ui/GlowCard";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { LanternIcon, PledgeJar, FolioLine } from "@/components/ui/Icons";
import { SwitchToMonad, useWalletModal } from "@/components/wallet/WalletModal";
import { Countdown } from "./Countdown";
import { ShareBox } from "./ShareBox";
import { TxPostmark } from "./TxPostmark";
import { PostcardView } from "./PostcardView";
import { chogLabel, getChog, gazeWord } from "@/lib/chogs";
import { DEPLOYED, ERC20_ABI, CHOG_TOKEN, SITE_URL, TWAIN } from "@/lib/contracts";
import { findRecentMeetBlock, postcardsForWalk, readCounters, readWalk, verifyMeetBlock } from "@/lib/twain";
import { useClients, useTx } from "@/lib/hooks";
import { chogAmount, noteToText, num, short, textToNote } from "@/lib/format";
import { proofFor } from "@/lib/gaze";
import { buildIcs, downloadIcs } from "@/lib/ics";
import type { GasKey } from "@/lib/tx";
import { explorerAddr } from "@/lib/chains";

const traitsOf = (id: number): Traits => {
  const c = getChog(id);
  return c ? { Aura: c.aura || undefined, Background: c.bg || undefined, Eyes: c.eyes || undefined, Accessory: c.acc || undefined, Tier: c.tier } : {};
};

export function WalkPage({ walkId }: { walkId: number }) {
  const { pc, address, isConnected, wrongChain } = useClients();
  const { open: openWallet } = useWalletModal();
  const tx = useTx();
  const search = useSearchParams();
  const [note, setNote] = useState("");
  const [stepSignal, setStepSignal] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [joinChog, setJoinChog] = useState<number | null>(null);
  const [hour, setHour] = useState("20:00");
  const [meetBlock, setMeetBlock] = useState<bigint | null>(null);
  const lastWalked = useRef<number | null>(null);

  const q = useQuery({ queryKey: ["walk", walkId], queryFn: () => readWalk(pc!, walkId), enabled: !!pc && DEPLOYED, refetchInterval: 5_000 });
  const counters = useQuery({ queryKey: ["counters"], queryFn: () => readCounters(pc!), enabled: !!pc && DEPLOYED, staleTime: 30_000 });
  const v = q.data;
  const w: Walk | undefined = v?.now;
  const stored: Walk | undefined = v?.walk;

  const me = address?.toLowerCase();
  const iAmA = !!me && !!w && me === w.walkerA.toLowerCase();
  const iAmB = !!me && !!w && me === w.walkerB.toLowerCase();
  const iWalk = iAmA || iAmB;

  const gaze = (id: number) => getChog(id)?.gaze ?? 1;
  const scene = useMemo(() => {
    if (!w || !v) return null;
    return sceneFor({ walk: w, gazeA: gaze(w.chogA), gazeB: w.chogB ? gaze(w.chogB) : 0, traitsA: traitsOf(w.chogA), traitsB: w.chogB ? traitsOf(w.chogB) : {}, viewer: address, day: v.day });
  }, [w, v, address]);

  // a step landed: hop, stamp thump, paper burst
  useEffect(() => {
    if (!scene) return;
    if (lastWalked.current !== null && scene.walked > lastWalked.current) setStepSignal((n) => n + 1);
    lastWalked.current = scene.walked;
  }, [scene]);

  // meeting block: the link param (verified with one getLogs over that block), the local record, or a short recent scan
  useEffect(() => {
    if (!pc || !w || w.status !== MET) return;
    let dead = false;
    (async () => {
      const p = search.get("b");
      const cached = typeof window !== "undefined" ? window.localStorage.getItem(`twain-meet-${walkId}`) : null;
      for (const cand of [p, cached]) {
        if (cand && /^\d+$/.test(cand) && (await verifyMeetBlock(pc, walkId, BigInt(cand)))) { if (!dead) setMeetBlock(BigInt(cand)); return; }
      }
      const f = await findRecentMeetBlock(pc, walkId);
      if (!dead && f) setMeetBlock(f);
    })();
    return () => { dead = true; };
  }, [pc, w?.status, walkId, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const postcards = useQuery({ queryKey: ["postcards", walkId], queryFn: () => postcardsForWalk(pc!, walkId), enabled: !!pc && w?.status === MET });

  const lanternPrice = counters.data?.lanternPrice ?? 0n;
  const bal = useQuery({
    queryKey: ["chogbal", address], enabled: !!pc && !!address && DEPLOYED,
    queryFn: async () => (await pc!.readContract({ address: CHOG_TOKEN, abi: ERC20_ABI, functionName: "balanceOf", args: [address!] })) as bigint,
  });

  if (!DEPLOYED) return <div className="page wrap"><NotDeployed what="A walk page" /></div>;
  if (q.isLoading || !pc) return <div className="page wrap" data-testid="walk-loading"><p className="mono muted">Reading walk {walkId} from the contract...</p></div>;
  if (q.error) return <div className="page wrap"><div className="notice bad" role="alert">The RPC did not answer: {(q.error as Error).message.split("\n")[0]}. Try again in a moment.</div></div>;
  if (!v || !w || !stored || !scene) {
    return (
      <div className="page wrap stack" data-testid="walk-missing">
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.2rem,5vw,3.6rem)" }}>No walk {walkId} yet</h1>
        <p className="muted">The contract counts {counters.data ? num(counters.data.walkCount) : "some"} walks so far.</p>
        <div className="row"><Link className="btn" href="/walk/new">Start the next one</Link></div>
      </div>
    );
  }

  const statusWord = w.status === OPEN ? "Open" : w.status === WALKING ? "Walking" : w.status === MET ? "Met" : w.status === APART ? "Apart" : "Cancelled";
  const todayIn = (iAmA && w.aIn) || (iAmB && w.bIn);
  const partnerIn = (iAmA && w.bIn) || (iAmB && w.aIn);
  const stale = stored.status === WALKING && (stored.curDay < v.day);
  const expired = w.status === OPEN && v.day > w.openedDay + 3;
  const postmarkText = w.status === MET ? `Chog Twain · day ${w.endDay}${meetBlock ? ` · block ${meetBlock.toLocaleString("en-US")}` : ""}` : undefined;
  const walkUrl = `${typeof window !== "undefined" ? window.location.origin : SITE_URL}/w/${walkId}`;

  async function showUp() {
    const meets = w!.gap === 1 && partnerIn === false && (w!.aIn || w!.bIn);
    const key: GasKey = meets ? "showUpMeet" : "showUp";
    const r = await tx.send("I'm here", "showUp", [BigInt(walkId), textToNote(note)], key);
    if (r) {
      setNote("");
      const after = await readWalk(pc!, walkId);
      if (after?.walk.status === MET) { try { window.localStorage.setItem(`twain-meet-${walkId}`, r.block.toString()); } catch { /* storage blocked */ } setMeetBlock(r.block); }
    }
  }
  async function light() {
    if (!(await tx.ensureAllowance(lanternPrice))) return;
    await tx.send("Light a lantern", "light", [BigInt(walkId)], "light", { note: lanternPrice > 0n ? `Burns ${chogAmount(lanternPrice)} $CHOG to the dead address. Keeps a day only one of them makes.` : undefined });
  }
  async function join() {
    if (!joinChog) return;
    if (w!.pledge > 0n && (bal.data ?? 0n) < w!.pledge) { tx.reset(); return; }
    const { gaze: g, proof } = await proofFor(joinChog);
    if (w!.pledge > 0n && !(await tx.ensureAllowance(w!.pledge))) return;
    await tx.send("Join the walk", "join", [BigInt(walkId), BigInt(joinChog), g, proof], "join");
  }

  const canAct = isConnected && !wrongChain;
  const connectOrSwitch = !isConnected ? <button className="btn" onClick={openWallet}>Connect a wallet</button> : wrongChain ? <SwitchToMonad /> : null;

  return (
    <div className="page wrap stack" style={{ ["--gap" as string]: "26px" }} data-testid="walk-page" data-status={statusWord.toLowerCase()}>
      <header className="stack" style={{ ["--gap" as string]: "8px" }}>
        <FolioLine extra={`WALK ${walkId}`} />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <h1 className="display sticker-type" style={{ fontSize: "clamp(2.2rem,5.4vw,4.4rem)", lineHeight: 1 }}>
            {w.status === MET ? "They met." : w.status === OPEN ? "Waiting for a friend" : w.status === APART ? "They drifted apart" : w.status === CANCELLED ? "Cancelled" : `${w.gap} ${w.gap === 1 ? "step" : "steps"} apart`}
          </h1>
          <div className="row"><span className={`tag mono ${w.status === MET ? "ok" : w.status === APART || w.status === CANCELLED ? "bad" : "warn"}`} data-testid="status">{statusWord}</span><span className="tag mono">{w.distance} day walk</span></div>
        </div>
        <p className="editorial" style={{ fontSize: "1.2rem" }}>
          {chogLabel(w.chogA)} <span className="muted">{gazeWord(gaze(w.chogA))}</span>{w.chogB ? <> and {chogLabel(w.chogB)} <span className="muted">{gazeWord(gaze(w.chogB))}</span></> : null}
        </p>
      </header>

      <Spread scene={scene} postmark={postmarkText} stepSignal={stepSignal} inviteHint={w.status === OPEN ? "An empty chair. A friend's Chog that looks at yours goes here." : undefined} />

      {/* OPEN: share or join */}
      {w.status === OPEN && (
        <div className="stack" style={{ ["--gap" as string]: "20px" }}>
          {expired && <div className="notice warn">This invite is more than 3 days old. It can no longer be joined; anyone can clear it.</div>}
          {iAmA ? (
            <>
              <ShareBox walkId={walkId} />
              <GlowCard className="flat row" style={{ justifyContent: "space-between" }}>
                <span className="muted">{w.pledge > 0n ? `Your pledge of ${chogAmount(w.pledge)} $CHOG comes back if you cancel.` : "No pledge on this walk."}</span>
                <button className="btn btn-ghost" disabled={tx.state.busy || !canAct} onClick={() => tx.send("Cancel the walk", "cancel", [BigInt(walkId)], "cancel")}>Cancel the walk</button>
              </GlowCard>
            </>
          ) : !expired ? (
            <GlowCard className="flat stack" data-testid="join-flow">
              <h2 style={{ fontSize: "1.8rem" }}>Join this walk</h2>
              <p className="muted">Only Chogs that look at {chogLabel(w.chogA)} are offered. Joining counts as your show-up for today.{w.invitee !== "0x0000000000000000000000000000000000000000" && ` This walk was opened for ${short(w.invitee)}.`}</p>
              {w.pledge > 0n && <div className="notice"><PledgeJar width={44} height={50} /><span>This walk has a pledge. Joining puts in the same <strong>{chogAmount(w.pledge)} $CHOG</strong>. You hold {chogAmount(bal.data ?? 0n)}.</span></div>}
              <ChogPicker value={joinChog} onChange={setJoinChog} facing={w.chogA} title="Pick a Chog that faces theirs" />
              {connectOrSwitch ?? <button className="btn" data-testid="join" disabled={!joinChog || tx.state.busy} onClick={join}>Join with {joinChog ? chogLabel(joinChog) : "a Chog"}</button>}
              {w.pledge > 0n && (bal.data ?? 0n) < w.pledge && isConnected && <div className="notice bad" role="alert">You hold {chogAmount(bal.data ?? 0n)} $CHOG. This pledge needs {chogAmount(w.pledge)}.</div>}
            </GlowCard>
          ) : (
            <button className="btn btn-ghost" onClick={() => tx.send("Clear the expired walk", "cancel", [BigInt(walkId)], "cancel")} disabled={!canAct}>Clear this expired walk</button>
          )}
        </div>
      )}

      {/* WALKING */}
      {w.status === WALKING && (
        <div className="grid g2" style={{ alignItems: "start" }}>
          <GlowCard className="flat stack" style={{ ["--gap" as string]: "14px" }}>
            <h2 style={{ fontSize: "1.8rem" }}>Today</h2>
            <p data-testid="today-status" style={{ fontSize: "1.15rem" }}>{scene.caption}</p>
            <Countdown />
            {iWalk ? (
              <>
                <div className="field"><label htmlFor="note">Leave a note, optional (28 bytes, public)</label>
                  <input id="note" className="input" maxLength={28} value={note} onChange={(e) => setNote(e.target.value)} placeholder="landed in Leipzig" disabled={todayIn} /></div>
                {connectOrSwitch ?? (
                  <button className={`btn btn-big ${todayIn ? "" : "btn-pulse"}`} data-testid="im-here" disabled={todayIn || tx.state.busy} onClick={showUp}>
                    {todayIn ? "You are here today" : "I'm here"}
                  </button>
                )}
                {todayIn && !partnerIn && <p className="muted">Your friend has until 00:00 UTC. If they miss, the Chogs drift one step apart{w.pledge > 0n ? " and a slice of their pledge comes to you" : ""}.</p>}
                <div className="row" style={{ alignItems: "flex-end" }}>
                  <div className="field"><label htmlFor="hr">Daily reminder</label><input id="hr" type="time" className="input" style={{ width: 130 }} value={hour} onChange={(e) => setHour(e.target.value)} /></div>
                  <button className="btn btn-ghost btn-small" data-testid="ics" onClick={() => { const [h, m] = hour.split(":").map(Number); downloadIcs(`chog-twain-walk-${walkId}.ics`, buildIcs({ walkId, url: walkUrl, hour: h || 0, minute: m || 0 })); }}>Add to calendar</button>
                </div>
              </>
            ) : (
              <p className="muted">You are watching. Only the two people on this walk can show up. You can still cheer them on or light a lantern.</p>
            )}
            <TxPostmark tx={tx.state} />
          </GlowCard>

          <div className="stack" style={{ ["--gap" as string]: "20px" }}>
            <GlowCard className="flat stack" style={{ ["--gap" as string]: "10px" }}>
              <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
                <LanternIcon lit={w.lanterns > 0} />
                <div className="stack" style={{ ["--gap" as string]: "6px" }}>
                  <h3>Lanterns {w.lanterns}/3</h3>
                  <p className="muted">Anyone can light one. It burns {lanternPrice ? chogAmount(lanternPrice) : "some"} $CHOG and keeps a day only one of them makes. It never covers a day nobody came.</p>
                  {w.lanternsUsed > 0 && <span className="mono">{w.lanternsUsed} already kept a day</span>}
                </div>
              </div>
              <div className="row">
                {connectOrSwitch ?? <button className="btn btn-pink btn-small" data-testid="light" disabled={tx.state.busy || w.lanterns >= 3} onClick={light}>{w.lanterns >= 3 ? "Three lanterns lit" : "Light a lantern"}</button>}
                <button className="btn btn-ghost btn-small" data-testid="cheer" disabled={tx.state.busy || !canAct} onClick={() => tx.send("Cheer", "cheer", [BigInt(walkId)], "cheer")}>Cheer ({num(v.cheers)})</button>
              </div>
            </GlowCard>

            <GlowCard className="flat stack" style={{ ["--gap" as string]: "8px" }}>
              <h3>Pledge</h3>
              {w.pledge > 0n ? (
                <>
                  <p>{chogAmount(w.pledge)} $CHOG each, held by the contract. Back on meeting, minus a slice of {chogAmount(w.pledge / BigInt(w.distance))} for each day the person missed.</p>
                  <p className="mono muted">Moved so far: {chogAmount(w.forfeitA)} from the opener, {chogAmount(w.forfeitB)} from the friend</p>
                </>
              ) : <p className="muted">No pledge on this walk. The promise is the point.</p>}
            </GlowCard>

            <GlowCard className="flat stack" style={{ ["--gap" as string]: "8px" }}>
              <h3>Notes</h3>
              <Notes label="Opener" note={v.noteA} /><Notes label="Friend" note={v.noteB} />
            </GlowCard>

            <div className="row">
              {stale && <button className="btn btn-ghost btn-small" data-testid="poke" disabled={!canAct || tx.state.busy} onClick={() => tx.send("Close past days", "poke", [BigInt(walkId)], "poke")}>Close yesterday for them</button>}
              {iWalk && !confirmLeave && <button className="btn btn-ghost btn-small" data-testid="leave" onClick={() => setConfirmLeave(true)}>Walk away</button>}
            </div>
            {iWalk && confirmLeave && (
              <div className="notice bad stack" role="alertdialog" aria-label="Confirm walking away" data-testid="leave-confirm">
                <strong>Walking away ends the walk now.</strong>
                <span>{w.pledge > 0n ? `You forfeit your whole pledge of ${chogAmount(w.pledge)} $CHOG to your friend. ` : ""}The steps already walked stay on the page, and both Chogs are free again. This cannot be undone.</span>
                <div className="row"><button className="btn btn-small" style={{ background: "#b03030" }} onClick={() => { setConfirmLeave(false); tx.send("Walk away", "leave", [BigInt(walkId)], "leave"); }}>Yes, walk away</button><button className="btn btn-ghost btn-small" onClick={() => setConfirmLeave(false)}>Keep walking</button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MET */}
      {w.status === MET && (
        <div className="stack" style={{ ["--gap" as string]: "24px" }} data-testid="met">
          <GlowCard className="flat stack">
            <h2 style={{ fontSize: "2rem" }}>The meeting is written onto both Chogs</h2>
            <p>After {w.steps} shared days, {chogLabel(w.chogA)} and {chogLabel(w.chogB)} stand together. Both Friend Books now hold this walk, and each of you has a postcard that cannot be sold or moved.</p>
            <div className="row">
              <Link className="btn btn-ghost btn-small" href={`/chog/${w.chogA}`}>Friend Book of {chogLabel(w.chogA)}</Link>
              <Link className="btn btn-ghost btn-small" href={`/chog/${w.chogB}`}>Friend Book of {chogLabel(w.chogB)}</Link>
            </div>
          </GlowCard>
          <div className="grid g2">
            {(postcards.data ?? []).map((p) => <PostcardView key={p.id} uri={p.uri} owner={p.owner} mine={!!me && p.owner.toLowerCase() === me} />)}
          </div>
          <GlowCard className="flat stack">
            <h3>Meeting card</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/card/${walkId}${meetBlock ? `?b=${meetBlock}` : ""}`} alt={`Meeting card for walk ${walkId}`} width={600} height={315} style={{ width: "100%", maxWidth: 600, height: "auto", borderRadius: 14, border: "1px solid var(--line)" }} />
            <div className="row">
              <a className="btn btn-small" target="_blank" rel="noopener" href={`https://x.com/intent/post?text=${encodeURIComponent(`They met. ${chogLabel(w.chogA)} and ${chogLabel(w.chogB)}, after ${w.steps} shared days on Chog Twain.`)}&url=${encodeURIComponent(`${walkUrl}${meetBlock ? `?b=${meetBlock}` : ""}`)}`}>Post on X</a>
              <Link className="btn btn-ghost btn-small" href="/walk/new">Walk again, further</Link>
            </div>
          </GlowCard>
          <TxPostmark tx={tx.state} />
        </div>
      )}

      {(w.status === APART || w.status === CANCELLED) && (
        <GlowCard className="flat stack" data-testid="ended">
          <h2 style={{ fontSize: "1.8rem" }}>{w.status === APART ? "This walk has ended" : "This walk was cancelled"}</h2>
          <p className="muted">{w.status === APART ? `They walked ${w.steps} shared ${w.steps === 1 ? "day" : "days"} before three unkept days in a row, or someone walking away, parted them. The steps they took are still drawn above.` : "No friend joined before the opener cancelled or the invite expired."}</p>
          {w.pledge > 0n && <p>Pledges are settled. Open <Link href="/me" style={{ textDecoration: "underline" }}>My walks</Link> to claim yours.</p>}
          <div className="row"><Link className="btn" href="/walk/new">Start a new walk</Link></div>
          <TxPostmark tx={tx.state} />
        </GlowCard>
      )}

      <p className="mono muted">Contract <a href={explorerAddr(TWAIN ?? "")} target="_blank" rel="noopener">{short(TWAIN)}</a> {"·"} read from storage, day {v.day} {"·"} opener {short(w.walkerA)}{w.walkerB !== "0x0000000000000000000000000000000000000000" ? ` · friend ${short(w.walkerB)}` : ""}</p>
    </div>
  );
}

function Notes({ label, note }: { label: string; note?: { text: string; day: number } }) {
  const t = note ? noteToText(note.text) : "";
  return (
    <p className="editorial" style={{ fontSize: "1.1rem" }} data-testid={`note-${label.toLowerCase()}`}>
      <span className="mono muted" style={{ fontStyle: "normal" }}>{label}{note ? ` · day ${note.day}` : ""}</span>{" "}
      {t ? `"${t}"` : <span className="muted">no note yet</span>}
    </p>
  );
}
