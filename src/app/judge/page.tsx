import type { Metadata } from "next";
import Link from "next/link";
import { GlowCard } from "@/components/ui/GlowCard";
import { FolioLine } from "@/components/ui/Icons";

export const metadata: Metadata = { title: "Judge walk", description: "A 60-second, 3-minute and 10-minute path through Chog Twain, with what to expect at each step.", openGraph: { images: ["/og/judge"] }, twitter: { card: "summary_large_image", images: ["/og/judge"] } };

const paths = [
  { id: "60s", title: "60 seconds, no wallet", steps: [
    ["Open the Demo", "/demo", "You see a banner that says Demo, and the setup card with Chog 1462 picked."],
    ["Press Open the walk, then Friend joins", "/demo", "Two real Chogs appear on a magazine spread, one on each page, a dashed gaze line between their eyes."],
    ["Press I'm here, then Friend shows up", "/demo", "Both Chogs hop one footprint closer, paper stamps burst, the gap goes down by one."],
    ["Press Friend misses, then Light a lantern", "/demo", "A dotted backward print appears; a lantern hangs at the fold and keeps the next one-sided day."],
    ["Press Walk it all the way", "/demo", "They meet: the postmark thumps down and a postcard and keepsakes appear."],
  ] },
  { id: "3m", title: "3 minutes, any wallet, no Chog", steps: [
    ["Read the discovery", "/", "Three numbers from the collection: how many Chogs look left, right and at you, and the cap on simultaneous walks."],
    ["Connect a wallet, switch to Monad", "/walk/new", "The capsule shows your address, MON and $CHOG balances, and a power icon that disconnects."],
    ["Open a walk", "/walk/new", "Filter by gaze, pick any Chog, choose 7 days, open. You see: Landed in block N (proposed), then Postmarked with the seconds to finality."],
    ["Join from a second wallet", "/me", "Only Chogs that face yours are offered. Joining counts as day one for your friend."],
    ["Light a lantern or cheer from a third wallet", "/heartbeat", "A fan with no Chog and no walk can still burn $CHOG for a lantern and cheer. Both show up on the Heartbeat."],
  ] },
  { id: "10m", title: "10 minutes, check the claims", steps: [
    ["Open Proof", "/proof", "Addresses with Sourcify links, the invariants with test names, the fuzz finding and the reverted mainnet transactions."],
    ["Run the verifier", "/proof", "node scripts/verify.mjs rebuilds the gaze root, recomputes every walk from events and decodes every postcard. It prints PASS or FAIL."],
    ["Open any Chog's page", "/chog/846", "Token and artwork numbers, gaze, whether it is walking, and its Friend Book read from storage."],
    ["Try to break a rule", "/demo", "The Break a rule panel shows the sentence for every contract error before a wallet would open."],
    ["Read the honest notes", "/proof", "One person with two wallets can walk alone. Nothing rewards it except their own record."],
  ] },
];

export default function Page() {
  return (
    <div className="page wrap-narrow stack" style={{ ["--gap" as string]: "28px" }}>
      <header className="stack" style={{ ["--gap" as string]: "8px" }}>
        <FolioLine extra="JUDGE" />
        <h1 className="display sticker-type" style={{ fontSize: "clamp(2.6rem,6.5vw,5rem)", lineHeight: 1 }}>60-second judge walk</h1>
        <p className="editorial" style={{ fontSize: "1.3rem" }}>The Chog is the point: its gaze decides who can meet. Pick a path.</p>
      </header>
      {paths.map((p) => (
        <GlowCard key={p.id} className="flat stack" style={{ ["--gap" as string]: "14px" }}>
          <h2 style={{ fontSize: "1.8rem" }} id={p.id}>{p.title}</h2>
          <ol className="stack" style={{ paddingLeft: "1.3rem", margin: 0, ["--gap" as string]: "12px" }}>
            {p.steps.map(([h, href, expect]) => (
              <li key={h}><Link href={href} style={{ textDecoration: "underline", fontFamily: "var(--font-fredoka)", fontWeight: 600 }}>{h}</Link><br /><span className="muted">Expect: {expect}</span></li>
            ))}
          </ol>
        </GlowCard>
      ))}
    </div>
  );
}