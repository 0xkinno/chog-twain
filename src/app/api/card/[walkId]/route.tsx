import { ImageResponse } from "next/og";
import sharp from "sharp";
import { fetchArt } from "@/lib/server/art";
import { bagel } from "@/lib/server/fonts";
import { serverClient } from "@/lib/server/chain";
import { TWAIN, TWAIN_ABI } from "@/lib/contracts";
import { getChog } from "@/lib/chogs";
import { toWalk, verifyMeetBlock } from "@/lib/twain";
import { MET } from "@rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function png(id: number): Promise<string | null> {
  const a = await fetchArt(id);
  if (!a) return null;
  const buf = await sharp(a.buf).resize(420, 420).png().toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** 1200x630 meeting card from chain state and both artworks. The block number appears only if it is verified. */
export async function GET(req: Request, ctx: { params: Promise<{ walkId: string }> }) {
  const { walkId } = await ctx.params;
  const id = Number(walkId);
  const url = new URL(req.url);
  if (!TWAIN || !Number.isInteger(id) || id < 1) return new Response("No such walk", { status: 404 });
  const pc = serverClient();
  let walk;
  try {
    const r = await pc.readContract({ address: TWAIN, abi: TWAIN_ABI, functionName: "walk", args: [BigInt(id)] });
    walk = toWalk(id, r as unknown as Record<string, unknown>);
  } catch {
    return new Response("The RPC did not answer", { status: 502 });
  }
  if (!walk.chogA) return new Response("No such walk", { status: 404 });
  const met = walk.status === MET;
  const claimed = url.searchParams.get("b");
  let block: bigint | null = null;
  if (met && claimed && /^\d+$/.test(claimed) && (await verifyMeetBlock(pc as never, id, BigInt(claimed)))) block = BigInt(claimed);
  const [a, b, font] = await Promise.all([png(walk.chogA), walk.chogB ? png(walk.chogB) : null, bagel(url.origin)]);
  const label = (t: number) => `TOKEN ${t} \u00b7 CHOG #${getChog(t)?.art ?? "?"}`;
  const headline = met ? "They met." : walk.status === 2 ? `${walk.gap} steps apart` : walk.status === 1 ? "Waiting for a friend" : "Apart";
  const tile = (src: string | null, t: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", padding: 10, background: "#fff", borderRadius: 30, boxShadow: "0 14px 30px rgba(35,22,77,.3)" }}>
        {src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} width={300} height={300} style={{ borderRadius: 22 }} alt="" /> : <div style={{ width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3eefe", borderRadius: 22, fontSize: 22, color: "#4b3d7a" }}>art is resting</div>}
      </div>
      <div style={{ display: "flex", marginTop: 14, fontSize: 22, letterSpacing: 2, color: "#4b3d7a" }}>{label(t)}</div>
    </div>
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 48, background: "linear-gradient(135deg,#efe9ff,#fbf9ff 55%,#ffe8f1)", color: "#23164d", border: "6px dashed rgba(108,74,182,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 3, color: "#4b3d7a" }}><div style={{ display: "flex" }}>CHOG TWAIN \u00b7 WALK {id}</div><div style={{ display: "flex" }}>{walk.distance} DAY WALK</div></div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          {tile(a, walk.chogA)}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 300 }}>
            <div style={{ display: "flex", fontSize: 84, lineHeight: 1, fontFamily: font ? "Bagel" : undefined, color: "#6c4ab6" }}>{headline}</div>
            <div style={{ display: "flex", marginTop: 14, fontSize: 28, color: "#4b3d7a" }}>{walk.steps} shared days</div>
            <div style={{ display: "flex", marginTop: 6, fontSize: 22, letterSpacing: 2, color: "#c0366c" }}>{met ? `DAY ${walk.endDay}${block ? ` \u00b7 BLOCK ${block.toString()}` : ""}` : ""}</div>
          </div>
          {walk.chogB ? tile(b, walk.chogB) : <div style={{ display: "flex", width: 320, height: 320, border: "5px dashed #6c4ab6", borderRadius: 30, alignItems: "center", justifyContent: "center", fontSize: 26, color: "#6c4ab6" }}>an empty chair</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#4b3d7a" }}><div style={{ display: "flex" }}>A meeting cannot be bought or rushed.</div><div style={{ display: "flex" }}>chogtwain.vercel.app</div></div>
      </div>
    ),
    { width: 1200, height: 630, fonts: font ? [{ name: "Bagel", data: font, style: "normal", weight: 400 }] : undefined, headers: { "cache-control": met ? "public, max-age=3600" : "no-store" } },
  );
}