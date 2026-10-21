import { fetchArt } from "@/lib/server/art";
import { isChogId } from "@/lib/chogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ tokenId: string }> }) {
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
  return new Response(new Uint8Array(art.buf), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-art-gateway": art.gateway,
    },
  });
}