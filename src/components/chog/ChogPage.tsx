"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useReadContract } from "wagmi";
import { MET, keepsakesFor, sceneFor } from "@rules";
import { ChogImg } from "@/components/ui/ChogImg";
import { GlowCard } from "@/components/ui/GlowCard";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { FolioLine, Stamp } from "@/components/ui/Icons";
import { SwitchToMonad, useWalletModal } from "@/components/wallet/WalletModal";
import { TxPostmark } from "@/components/walk/TxPostmark";
import { chogLabel, getChog, gazeName, gazeWord, ALL } from "@/lib/chogs";
import { CHOG_GENESIS, DEPLOYED, ERC721_ABI } from "@/lib/contracts";
import { chogState, friendBook, readWalks } from "@/lib/twain";
import { useClients, useTx } from "@/lib/hooks";
import { short } from "@/lib/format";

export function ChogPage({ id }: { id: number }) {
  const c = getChog(id)!;
  const { pc, address, isConnected, wrongChain } = useClients();
  const { open } = useWalletModal();
  const tx = useTx();
  const st = useQuery({ queryKey: ["chog", id], queryFn: () => chogState(pc!, id), enabled: !!pc && DEPLOYED, refetchInterval: 8_000 });
  const book = useQuery({ queryKey: ["book", id], queryFn: async () => readWalks(pc!, await friendBook(pc!, id)), enabled: !!pc && DEPLOYED });
  const owner = useReadContract({ address: CHOG_GENESIS, abi: ERC721_ABI, functionName: "ownerOf", args: [BigInt(id)], query: { enabled: DEPLOYED } });
  const holder = (owner.data as string | undefined)?.toLowerCase();
  const iHold = !!address && holder === address.toLowerCase();
  const tone = c.gaze === 1 ? "left" : c.gaze === 2 ? "right" : "front";
  void sceneFor; void keepsakesFor;

  return (
    <div className="page wrap stack" style={{ ["--gap" as string]: "28px" }}>
      <header className="stack" style={{ ["--gap" as string]: "8px" }}>
        <FolioLine extra={`TOKEN ${id}`} />
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.4rem,6vw,4.6rem)", lineHeight: 1 }}>{chogLabel(id)}</h1>
        <div className="row"><span className={`tag mono ${tone}`}>{gazeName(c.gaze)} {"\u00b7"} {gazeWord(c.gaze)}</span><span className="tag mono">{c.tier}</span>{c.aura && <span className="tag mono">{c.aura}</span>}</div>
      </header>
      <div className="grid" style={{ gridTemplateColumns: "minmax(240px,380px) minmax(0,1fr)", alignItems: "start" }}>
        <div className="sticker" style={{ maxWidth: 380 }}><ChogImg id={id} eager /></div>
        <div className="stack" style={{ ["--gap" as string]: "16px" }}>
          {!DEPLOYED ? <NotDeployed what="A Chog's Friend Book" /> : (
            <>
              <GlowCard className="flat stack" style={{ ["--gap" as string]: "8px" }}>
                <h3>Right now</h3>
                {st.isLoading ? <p className="mono muted">Reading the contract...</p> :
                  st.data?.activeWalk ? <p data-testid="chog-state">Walking in <Link href={`/w/${st.data.activeWalk}`} style={{ textDecoration: "underline" }}>walk {st.data.activeWalk}</Link>. It can cheer, but not join another walk until this one ends.</p>
                    : <p data-testid="chog-state">Free. {c.gaze === 3 ? "A 1:1 looks straight out and can meet any Chog." : `Only a Chog that looks ${c.gaze === 1 ? "right" : "left"} can walk toward it.`}</p>}
                <div className="row"><Link className="btn btn-small" href="/walk/new">Start a walk with it</Link></div>
              </GlowCard>
              <GlowCard className="flat stack" style={{ ["--gap" as string]: "10px" }}>
                <h3>Friend Book {st.data ? `(${st.data.met} met)` : ""}</h3>
                {book.isLoading ? <p className="mono muted">Reading...</p> : (book.data ?? []).length === 0 ? <p className="muted" data-testid="book-empty">Nobody has met this Chog yet. Its first meeting will be written here forever.</p> :
                  <div className="table-scroll"><table className="table" data-testid="book"><thead><tr><th>Walk</th><th>Met with</th><th>Days</th><th>Distance</th></tr></thead><tbody>
                    {(book.data ?? []).map((w) => { const other = w.chogA === id ? w.chogB : w.chogA; return <tr key={w.id}><td><Link href={`/w/${w.id}`} style={{ textDecoration: "underline" }}>#{w.id}</Link></td><td><Link href={`/chog/${other}`} style={{ textDecoration: "underline" }}>{chogLabel(other)}</Link></td><td className="mono">{w.steps}</td><td className="mono">{w.distance}</td></tr>; })}
                  </tbody></table></div>}
              </GlowCard>
              <GlowCard className="flat stack" style={{ ["--gap" as string]: "10px" }}>
                <h3>Keepsakes on this Chog</h3>
                <div className="row" style={{ gap: 14 }}>
                  {(book.data ?? []).some((w) => w.status === MET) ? (["met-7", "met-14", "met-30"] as const).filter((k) => (book.data ?? []).some((w) => w.status === MET && `met-${w.distance}` === k)).map((k) => <Stamp key={k} label={`Met at ${k.slice(4)}`}><circle r="22" fill="#efe9ff" stroke="#6c4ab6" strokeWidth="3" /><path d="M-12 2q6 8 12 0t12 0" fill="none" stroke="#ff7aa8" strokeWidth="3" strokeLinecap="round" /></Stamp>) : <p className="muted">Stamps appear here as this Chog meets friends.</p>}
                </div>
              </GlowCard>
              <GlowCard className="flat stack" style={{ ["--gap" as string]: "8px" }}>
                <h3>Holder extras</h3>
                <p className="muted">Optional. If your wallet holds this Chog you can keep it for yourself ("home only") so nobody else can walk with it. It follows the token through live ownerOf: sell it and the new holder holds the key. {holder ? <>Held by <span className="mono">{short(holder)}</span>.</> : null}</p>
                {!isConnected ? <button className="btn btn-small" onClick={open}>Connect a wallet</button> : wrongChain ? <SwitchToMonad small /> :
                  iHold ? <button className="btn btn-small" data-testid="home-toggle" disabled={tx.state.busy} onClick={() => tx.send(st.data?.homeOnly ? "Open it to others" : "Keep it home only", "setHome", [BigInt(id), !st.data?.homeOnly], "setHome")}>{st.data?.homeOnly ? "Home only is ON: turn off" : "Turn home only on"}</button>
                    : <p className="mono muted" data-testid="not-holder">Only the holder sees this switch. {st.data?.homeOnly ? "Its holder keeps it home only." : ""}</p>}
                <TxPostmark tx={tx.state} />
              </GlowCard>
            </>
          )}
        </div>
      </div>
      <p className="mono muted">{ALL.length.toLocaleString("en-US")} Chogs in the collection {"\u00b7"} <Link href="/walk/new" style={{ textDecoration: "underline" }}>Pick another</Link></p>
    </div>
  );
}