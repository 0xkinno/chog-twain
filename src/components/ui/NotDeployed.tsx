import Link from "next/link";
import { GlowCard } from "./GlowCard";

/** Honest state when this build has no ChogTwain address. Never a silent fallback. */
export function NotDeployed({ what = "This page" }: { what?: string }) {
  return (
    <GlowCard className="flat" style={{ maxWidth: 640 }}>
      <div className="stack" data-testid="not-deployed">
        <span className="tag warn mono">No contract in this build</span>
        <h3>{what} reads the ChogTwain contract on Monad.</h3>
        <p className="muted">This build is not pointed at a deployed contract yet, so there is nothing real to show here. The Demo runs the same rules locally with real Chog art and needs no wallet.</p>
        <div className="row"><Link href="/demo" className="btn">Open the Demo</Link><Link href="/proof" className="btn btn-ghost">See the Proof page</Link></div>
      </div>
    </GlowCard>
  );
}