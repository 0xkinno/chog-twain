import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { artFile, IMAGE_BASE } from "@/lib/chogs";

/** Gateways in order, 6 s each. The one that answered is reported in X-Art-Gateway. */
export const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://ipfs.filebase.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://4everland.io/ipfs/",
];

export interface ArtResult { buf: Buffer; gateway: string }

const memo = new Map<number, ArtResult>();
const inflight = new Map<number, Promise<ArtResult | null>>();
const DISK = join(tmpdir(), "chog-twain-art");
// artwork the landing page, the Demo and the hero use is shipped with the app (scripts/cache-art.mjs), so the first
// screen never depends on a public IPFS gateway being up. Everything else comes from the gateways.
const SHIPPED = join(process.cwd(), "public", "art");

let active = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= 6) await new Promise<void>((r) => waiting.push(r));
  active++;
  try { return await fn(); } finally { active--; waiting.shift()?.(); }
}

async function fromGateways(tokenId: number): Promise<ArtResult | null> {
  const file = artFile(tokenId);
  if (!file) return null;
  for (let round = 0; round < 2; round++) {
    for (const g of GATEWAYS) {
      try {
        const res = await fetch(`${g}${IMAGE_BASE}/${file}`, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 500) continue;
        // 512 px webp is plenty for a sticker and keeps every response small
        const small = await sharp(buf).resize(512, 512).webp({ quality: 82 }).toBuffer().catch(() => buf);
        return { buf: small, gateway: new URL(g).host };
      } catch { /* try the next gateway */ }
    }
  }
  return null;
}

export async function fetchArt(tokenId: number): Promise<ArtResult | null> {
  const hit = memo.get(tokenId);
  if (hit) return hit;
  const shipped = join(SHIPPED, `${tokenId}.webp`);
  if (existsSync(shipped)) { const r = { buf: readFileSync(shipped), gateway: "shipped with the app" }; memo.set(tokenId, r); return r; }
  const disk = join(DISK, `${tokenId}.webp`);
  if (existsSync(disk)) { const r = { buf: readFileSync(disk), gateway: "server disk cache" }; memo.set(tokenId, r); return r; }
  let p = inflight.get(tokenId);
  if (!p) {
    p = slot(() => fromGateways(tokenId)).then((r) => {
      inflight.delete(tokenId);
      if (r) {
        if (memo.size > 300) memo.clear();
        memo.set(tokenId, r);
        try { mkdirSync(DISK, { recursive: true }); writeFileSync(disk, r.buf); } catch { /* read-only disk: memory cache only */ }
      }
      return r;
    });
    inflight.set(tokenId, p);
  }
  return p;
}