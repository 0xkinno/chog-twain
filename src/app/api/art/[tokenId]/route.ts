import { fetchArt } from "@/lib/server/art";
import { isChogId } from "@/lib/chogs";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await ctx.params;
  const id = Number(tokenId);
  if (!isChogId(id)) return new Response(JSON.stringify({ error: "That is not a Chog Genesis token number." }), { status: 404, headers: { "content-type": "application/json" } });
  const art = await fetchArt(id);
  if (!art) {
    return new Response(JSON.stringify({ error: "Art is resting: every IPFS gateway timed out. Try again in a moment." }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store", "retry-after": "5" },
    });
  }
  // ?w=128 or ?w=256 serves a small webp for thumbnails (the full 512 px art is the default)
  const w = Number(new URL(req.url).searchParams.get("w"));
  let body: Buffer = art.buf;
  if (w === 128 || w === 256) body = await sharp(art.buf).resize(w, w).webp({ quality: 76 }).toBuffer();
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-art-gateway": art.gateway,
    },
  });
}