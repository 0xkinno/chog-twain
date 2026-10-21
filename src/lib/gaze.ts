import type { Hex } from "viem";

interface GazeFile { root: Hex; proofs: Record<string, { side: number; proof: Hex[] }> }
let cache: Promise<GazeFile> | null = null;

/** The proof file is a static asset, fetched only when a walk is opened or joined. */
export function loadGaze(): Promise<GazeFile> {
  cache ??= fetch("/data/gaze.json").then((r) => {
    if (!r.ok) throw new Error(`gaze.json answered ${r.status}`);
    return r.json();
  });
  return cache;
}

export async function proofFor(tokenId: number): Promise<{ gaze: number; proof: Hex[] }> {
  const g = await loadGaze();
  const p = g.proofs[String(tokenId)];
  if (!p) throw new Error(`no gaze proof for token ${tokenId}`);
  return { gaze: p.side, proof: p.proof };
}