import Link from "next/link";
import { GITHUB_URL } from "@/lib/links";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap grid g3">
        <div className="stack" style={{ ["--gap" as string]: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.svg" alt="Chog Twain" width={220} height={57} />
          <p className="muted">Independent fan project. Chog art belongs to its creators and holders.</p>
        </div>
        <div className="stack" style={{ ["--gap" as string]: "6px" }}>
          <span className="label">Explore</span>
          <Link href="/walk/new">Start a walk</Link>
          <Link href="/demo">Try it without a wallet</Link>
          <Link href="/judge">60-second judge walk</Link>
          <Link href="/heartbeat">Heartbeat</Link>
        </div>
        <div className="stack" style={{ ["--gap" as string]: "6px" }}>
          <span className="label">Evidence</span>
          <Link href="/proof">Proof</Link>
          <a href={GITHUB_URL} rel="noopener">Source on GitHub</a>
          <a href="https://chogathon.chog.xyz" rel="noopener">Chogathon 2026</a>
          <span className="mono muted">Built by @0xkinno</span>
        </div>
      </div>
    </footer>
  );
}