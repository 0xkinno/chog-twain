"use client";
import { useState } from "react";
import { artUrl } from "@/lib/art";
import { chogLabel, getChog } from "@/lib/chogs";

/** Real Chog art through /api/art. If every gateway is down, a designed "art is resting" tile, never a broken image. */
export function ChogImg({ id, size, eager = false, className = "" }: { id: number; size?: number; eager?: boolean; className?: string }) {
  const [bad, setBad] = useState(false);
  const c = getChog(id);
  return (
    <span className={`chog-img ${className}`} style={size ? { width: size } : undefined} data-token={id}>
      {bad ? (
        <span className="chog-rest" role="img" aria-label={`Art for ${chogLabel(id)} is resting`}>
          <span className="mono">Art is resting</span>
          <span className="mono">{chogLabel(id)}</span>
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artUrl(id)} alt={c ? `Chog ${c.art}, token ${id}` : `Token ${id}`} loading={eager ? "eager" : "lazy"} decoding="async" width={512} height={512} onError={() => setBad(true)} />
      )}
    </span>
  );
}