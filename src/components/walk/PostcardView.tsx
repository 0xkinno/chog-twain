"use client";
import { useMemo } from "react";
import { decodePostcard } from "@/lib/twain";
import { short } from "@/lib/format";
import { GlowCard } from "@/components/ui/GlowCard";

/** The postcard drawn fully on-chain: decoded from the contract's tokenURI, nothing hosted by us. */
export function PostcardView({ uri, owner, mine }: { uri: string; owner: string; mine?: boolean }) {
  const card = useMemo(() => { try { return decodePostcard(uri); } catch { return null; } }, [uri]);
  if (!card) return <div className="notice bad">This postcard could not be decoded.</div>;
  const src = `data:image/svg+xml;base64,${btoa(card.svg)}`;
  return (
    <GlowCard className="flat stack" style={{ ["--gap" as string]: "10px" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="mono muted">Postcard {"\u00b7"} soulbound</span>
        <span className={`tag mono ${mine ? "ok" : ""}`} data-testid="postcard-owner">{mine ? "Yours" : short(owner)}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={card.name} data-testid="postcard-img" style={{ width: "100%", height: "auto", borderRadius: 14, border: "1px solid var(--line)" }} />
      <strong style={{ fontFamily: "var(--font-fredoka)" }}>{card.name}</strong>
      <p className="muted">{card.description}</p>
    </GlowCard>
  );
}