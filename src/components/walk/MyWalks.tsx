"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { OPEN, WALKING, MET, APART, CANCELLED, type Walk } from "@rules";
import { GlowCard } from "@/components/ui/GlowCard";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { ChogImg } from "@/components/ui/ChogImg";
import { FolioLine } from "@/components/ui/Icons";
import { SwitchToMonad, useWalletModal } from "@/components/wallet/WalletModal";
import { PostcardView } from "./PostcardView";
import { TxPostmark } from "./TxPostmark";
import { DEPLOYED } from "@/lib/contracts";
import { claimable, postcardsOf, readWalk, walksOf } from "@/lib/twain";
import { useClients, useTx } from "@/lib/hooks";
import { chogAmount, short } from "@/lib/format";
import { chogLabel } from "@/lib/chogs";

export function MyWalks() {
  const { pc, address, isConnected, wrongChain } = useClients();
  const { open } = useWalletModal();
  const tx = useTx();
  const ids = useQuery({ queryKey: ["walksOf", address], queryFn: () => walksOf(pc!, address!), enabled: !!pc && !!address && DEPLOYED, refetchInterval: 8_000 });
  const views = useQuery({
    queryKey: ["myviews", address, (ids.data ?? []).join(",")],
    queryFn: async () => (await Promise.all((ids.data ?? []).map((i) => readWalk(pc!, i)))).filter((x): x is NonNullable<typeof x> => !!x),
    enabled: !!pc && !!ids.data, refetchInterval: 8_000,
  });
  const owed = useQuery({ queryKey: ["claimable", address], queryFn: () => claimable(pc!, address!), enabled: !!pc && !!address && DEPLOYED, refetchInterval: 8_000 });
  const cards = useQuery({ queryKey: ["postcardsOf", address, owed.dataUpdatedAt], queryFn: () => postcardsOf(pc!, address!), enabled: !!pc && !!address && DEPLOYED });

  if (!DEPLOYED) return <div className="page wrap"><NotDeployed what="My walks" /></div>;

  const list = views.data ?? [];
  const todo = list.filter((v) => v.now.status === WALKING && !((address && v.now.walkerA.toLowerCase() === address.toLowerCase() ? v.now.aIn : v.now.bIn)));
  const active = list.filter((v) => v.now.status === WALKING || v.now.status === OPEN);
  const ended = list.filter((v) => ![WALKING, OPEN].includes(v.now.status));

  return (
    <div className="page wrap stack" style={{ ["--gap" as string]: "28px" }}>
      <header className="stack" style={{ ["--gap" as string]: "8px" }}>
        <FolioLine extra="MY WALKS" />
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.6rem,6.5vw,5rem)", lineHeight: 1 }}>My walks</h1>
        <p className="editorial" style={{ fontSize: "1.3rem" }}>Everything you owe a friend today, and everything you have kept.</p>
      </header>

      {!isConnected ? (
        <GlowCard className="flat stack" style={{ maxWidth: 560 }}><h3>Connect a wallet to see your walks</h3><p className="muted">Walks are read from the contract by wallet address. No account, no database.</p><button className="btn" onClick={open}>Connect a wallet</button></GlowCard>
      ) : wrongChain ? <SwitchToMonad /> : (
        <>
          {(owed.data ?? 0n) > 0n && (
            <GlowCard className="flat row" style={{ justifyContent: "space-between" }} data-testid="claim-box">
              <div><span className="label">Claimable</span><div className="display" style={{ fontSize: "2.4rem" }} data-testid="claimable">{chogAmount(owed.data ?? 0n)} $CHOG</div></div>
              <button className="btn" data-testid="claim" disabled={tx.state.busy} onClick={() => tx.send("Claim $CHOG", "claim", [], "claim")}>Claim</button>
            </GlowCard>
          )}
          <TxPostmark tx={tx.state} />
          <section className="stack" aria-label="Today"><h2 style={{ fontSize: "1.8rem" }}>Today's to-do</h2>
            {ids.isLoading ? <p className="mono muted">Reading your walks...</p> : todo.length === 0 ? <p className="muted" data-testid="todo-empty">Nothing waiting on you right now.</p> :
              <div className="grid g3">{todo.map((v) => <WalkCard key={v.walk.id} w={v.now} cta="I'm here today" />)}</div>}
          </section>
          <section className="stack" aria-label="Active walks"><h2 style={{ fontSize: "1.8rem" }}>Active and waiting</h2>
            {active.length === 0 ? <p className="muted">No active walks. <Link href="/walk/new" style={{ textDecoration: "underline" }}>Start one</Link>.</p> :
              <div className="grid g3" data-testid="active-walks">{active.map((v) => <WalkCard key={v.walk.id} w={v.now} />)}</div>}
          </section>
          <section className="stack" aria-label="Postcards"><h2 style={{ fontSize: "1.8rem" }}>Postcards</h2>
            {(cards.data ?? []).length === 0 ? <p className="muted">A postcard is printed for each person when two Chogs meet.</p> :
              <div className="grid g2" data-testid="postcards">{(cards.data ?? []).map((c) => <PostcardView key={c.id} uri={c.uri} owner={address!} mine />)}</div>}
          </section>
          {ended.length > 0 && <section className="stack" aria-label="Finished walks"><h2 style={{ fontSize: "1.8rem" }}>Finished</h2><div className="grid g3">{ended.map((v) => <WalkCard key={v.walk.id} w={v.now} />)}</div></section>}
        </>
      )}
    </div>
  );
}

function WalkCard({ w, cta }: { w: Walk; cta?: string }) {
  const word = w.status === OPEN ? "Open" : w.status === WALKING ? "Walking" : w.status === MET ? "Met" : w.status === APART ? "Apart" : w.status === CANCELLED ? "Cancelled" : "";
  return (
    <Link href={`/w/${w.id}`} style={{ textDecoration: "none" }} data-testid="walk-card">
      <GlowCard className="stack" style={{ ["--gap" as string]: "10px", height: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between" }}><span className="mono">Walk {w.id}</span><span className={`tag mono ${w.status === MET ? "ok" : w.status === APART || w.status === CANCELLED ? "bad" : "warn"}`}>{word}</span></div>
        <div className="row" style={{ flexWrap: "nowrap", gap: 10 }}>
          <div className="sticker" style={{ width: 84 }}><ChogImg id={w.chogA} /></div>
          {w.chogB ? <div className="sticker" style={{ width: 84 }}><ChogImg id={w.chogB} /></div> : <div style={{ width: 84, aspectRatio: "1", border: "2px dashed var(--hood)", borderRadius: 16 }} aria-label="empty chair" />}
        </div>
        <span className="muted">{chogLabel(w.chogA)}{w.chogB ? ` and ${chogLabel(w.chogB)}` : ""}</span>
        <span className="mono muted">{w.status === WALKING ? `${w.gap} steps apart \u00b7 ${w.distance} day walk` : w.status === OPEN ? `waiting for a friend \u00b7 ${w.distance} day walk` : `${w.steps} shared days`}</span>
        {w.pledge > 0n && <span className="mono muted">pledge {chogAmount(w.pledge)} $CHOG</span>}
        {cta && <span className="btn btn-small" style={{ alignSelf: "flex-start" }}>{cta}</span>}
        <span className="mono muted">{short(w.walkerA)}</span>
      </GlowCard>
    </Link>
  );
}