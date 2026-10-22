"use client";
import { useState } from "react";
import Link from "next/link";
import { isAddress, parseUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { ChogPicker } from "@/components/chog/ChogPicker";
import { ChogImg } from "@/components/ui/ChogImg";
import { GlowCard } from "@/components/ui/GlowCard";
import { NotDeployed } from "@/components/ui/NotDeployed";
import { FolioLine, PledgeJar } from "@/components/ui/Icons";
import { SwitchToMonad, useWalletModal } from "@/components/wallet/WalletModal";
import { TxPostmark } from "./TxPostmark";
import { ShareBox } from "./ShareBox";
import { DEPLOYED, ERC20_ABI, CHOG_TOKEN } from "@/lib/contracts";
import { chogLabel, gazeWord, getChog } from "@/lib/chogs";
import { parseOpened, useClients, useTx } from "@/lib/hooks";
import { proofFor } from "@/lib/gaze";
import { DISTANCES, PLEDGE_PRESETS } from "@/lib/config";
import { chogAmount } from "@/lib/format";

export function OpenWalk() {
  const { address, isConnected, wrongChain, pc } = useClients();
  const { open } = useWalletModal();
  const tx = useTx();
  const [chog, setChog] = useState<number | null>(null);
  const [distance, setDistance] = useState<7 | 14 | 30>(7);
  const [pledge, setPledge] = useState<number>(0);
  const [custom, setCustom] = useState("");
  const [invitee, setInvitee] = useState("");
  const [walkId, setWalkId] = useState<number | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const bal = useQuery({
    queryKey: ["chogbal", address],
    queryFn: async () => (await pc!.readContract({ address: CHOG_TOKEN, abi: ERC20_ABI, functionName: "balanceOf", args: [address!] })) as bigint,
    enabled: !!pc && !!address && DEPLOYED,
  });

  const pledgeWei = (() => { try { return parseUnits(String(custom || pledge || 0), 18); } catch { return 0n; } })();

  async function submit() {
    setFormErr(null);
    if (!chog) return setFormErr("Pick a Chog first.");
    if (invitee && !isAddress(invitee)) return setFormErr("The invitee must be a wallet address that starts with 0x, or left empty.");
    if (pledgeWei > 0n && (bal.data ?? 0n) < pledgeWei) return setFormErr(`You hold ${chogAmount(bal.data ?? 0n)} $CHOG. A pledge of ${chogAmount(pledgeWei)} needs more.`);
    const { gaze, proof } = await proofFor(chog);
    if (pledgeWei > 0n && !(await tx.ensureAllowance(pledgeWei))) return;
    const r = await tx.send("Open the walk", "open", [BigInt(chog), gaze, proof, distance, pledgeWei, (invitee || "0x0000000000000000000000000000000000000000") as `0x${string}`], "open", pledgeWei > 0n ? { note: pledgeWei > 0n ? "2 of 2: open the walk and escrow the pledge" : undefined } : undefined);
    if (r) setWalkId(parseOpened(r.receipt));
  }

  if (!DEPLOYED) return <div className="page wrap"><NotDeployed what="Opening a walk" /></div>;

  return (
    <div className="page wrap stack" style={{ ["--gap" as string]: "28px" }}>
      <header className="stack" style={{ ["--gap" as string]: "10px" }}>
        <FolioLine extra="NEW WALK" />
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.6rem,6.5vw,5rem)", lineHeight: 1 }}>Start a walk</h1>
        <p className="editorial" style={{ fontSize: "1.3rem", maxWidth: 640 }}>Pick any Chog. Its gaze decides who can walk toward it. You do not need to own it.</p>
      </header>

      {walkId ? (
        <div className="stack" style={{ ["--gap" as string]: "20px" }} data-testid="opened">
          <div className="notice ok"><span><strong>Walk {walkId} is open.</strong> It waits 3 days for a friend. Your Chog is locked to this walk until it ends.</span></div>
          <TxPostmark tx={tx.state} />
          <ShareBox walkId={walkId} />
          <div className="row"><Link className="btn" href={`/w/${walkId}`}>Go to the walk</Link><Link className="btn btn-ghost" href="/me">My walks</Link></div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(300px,1fr)", alignItems: "start" }}>
          <GlowCard className="flat"><ChogPicker value={chog} onChange={setChog} /></GlowCard>
          <div className="stack" style={{ position: "sticky", top: 96, ["--gap" as string]: "16px" }}>
            <GlowCard className="flat stack">
              <h3>Your walk</h3>
              {chog ? (
                <div className="row" style={{ gap: 14, flexWrap: "nowrap" }} data-testid="chosen">
                  <div className="sticker" style={{ width: 110, flex: "none" }}><ChogImg id={chog} /></div>
                  <div className="stack" style={{ ["--gap" as string]: "4px" }}>
                    <strong style={{ fontFamily: "var(--font-fredoka)" }}>{chogLabel(chog)}</strong>
                    <span className="mono muted">{gazeWord(getChog(chog)?.gaze ?? 0)}</span>
                    <span className="muted">Your friend needs a Chog that {getChog(chog)?.gaze === 3 ? "looks at you or any other" : getChog(chog)?.gaze === 1 ? "looks right" : "looks left"}.</span>
                  </div>
                </div>
              ) : <p className="muted">Pick a Chog on the left.</p>}
              <div className="field"><span className="label">Distance in days</span>
                <div className="row" role="radiogroup" aria-label="Distance">
                  {DISTANCES.map((d) => <button key={d} role="radio" aria-checked={distance === d} className="chip" onClick={() => setDistance(d)}>{d} days</button>)}
                </div>
              </div>
              <div className="field"><span className="label">Pledge, optional</span>
                <div className="row" role="radiogroup" aria-label="Pledge">
                  {PLEDGE_PRESETS.map((p) => <button key={p} role="radio" aria-checked={pledge === p && !custom} className="chip" onClick={() => { setPledge(p); setCustom(""); }}>{p === 0 ? "None" : `${p} $CHOG`}</button>)}
                  <input className="input" style={{ width: 120 }} inputMode="decimal" placeholder="Custom" aria-label="Custom pledge" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))} />
                </div>
                <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}><PledgeJar width={44} height={50} /><p className="muted">Your friend puts in the same. Miss a day and a slice goes to them. Walk away and the whole pledge does.</p></div>
              </div>
              <div className="field"><label htmlFor="inv">Invite one wallet only, optional</label>
                <input id="inv" className="input mono" placeholder="0x... leave empty for anyone with the link" value={invitee} onChange={(e) => setInvitee(e.target.value.trim())} />
              </div>
              {formErr && <div className="notice bad" role="alert" data-testid="form-error">{formErr}</div>}
              {!isConnected ? <button className="btn" onClick={open}>Connect a wallet</button>
                : wrongChain ? <SwitchToMonad />
                : <button className="btn" data-testid="open-walk" disabled={tx.state.busy} onClick={submit}>Open the walk</button>}
              <TxPostmark tx={tx.state} />
            </GlowCard>
          </div>
        </div>
      )}
    </div>
  );
}