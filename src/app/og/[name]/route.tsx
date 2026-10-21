import { ImageResponse } from "next/og";
import { bagel } from "@/lib/server/fonts";

export const runtime = "nodejs";

const COPY: Record<string, [string, string]> = {
  home: ["Every Chog is looking at someone.", "Pick one. Send it to a friend. Every day you both show up, they step closer."],
  walk: ["Start a walk", "Pick a Chog, pick a distance, send the link."],
  me: ["My walks", "Today's to-do, postcards and claimable $CHOG."],
  heartbeat: ["Heartbeat", "Steps, meetings, lanterns and pledges, live from the contract."],
  proof: ["Proof", "One contract, no admin. Check it yourself."],
  demo: ["Try it without a wallet", "The whole loop on the local rules engine, with real Chog art."],
  judge: ["60-second judge walk", "Numbered steps, with what to expect."],
};

export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const [title, sub] = COPY[name] ?? COPY.home;
  const font = await bagel(new URL(req.url).origin);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg,#efe9ff,#fbf9ff 55%,#ffe8f1)", color: "#23164d" }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: "#4b3d7a" }}>ISSUE 01 · CHOGTOBER 2026 · MONAD</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: name === "home" ? 104 : 120, lineHeight: 1, fontFamily: font ? "Bagel" : undefined, color: "#23164d", maxWidth: 1000 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 24, color: "#4b3d7a", maxWidth: 900 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30 }}>
          <div style={{ display: "flex", fontFamily: font ? "Bagel" : undefined, fontSize: 44, color: "#6c4ab6" }}>Chog Twain</div>
          <div style={{ display: "flex", color: "#c0366c", fontSize: 24 }}>A meeting cannot be bought or rushed.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: font ? [{ name: "Bagel", data: font, style: "normal", weight: 400 }] : undefined },
  );
}