"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SITE_URL } from "@/lib/contracts";

export function ShareBox({ walkId, title = "Send this link to your friend" }: { walkId: number; title?: string }) {
  const [url, setUrl] = useState(`${SITE_URL}/w/${walkId}`);
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { setUrl(`${window.location.origin}/w/${walkId}`); }, [walkId]);
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#23164d", light: "#ffffff" } }).then(setQr).catch(() => setQr("")); }, [url]);
  return (
    <div className="glow-card flat stack" data-testid="share-box" style={{ ["--gap" as string]: "12px" }}>
      <h3>{title}</h3>
      <div className="row" style={{ alignItems: "flex-start", gap: 20 }}>
        {qr && /* eslint-disable-next-line @next/next/no-img-element */ <img src={qr} alt={`QR code for walk ${walkId}`} width={140} height={140} style={{ borderRadius: 12, border: "1px solid var(--line)" }} />}
        <div className="stack" style={{ flex: 1, minWidth: 220, ["--gap" as string]: "10px" }}>
          <input className="input mono" readOnly value={url} aria-label="Walk link" onFocus={(e) => e.currentTarget.select()} />
          <div className="row">
            <button className="btn btn-small" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ } }}>{copied ? "Copied" : "Copy link"}</button>
            <a className="btn btn-ghost btn-small" href={`https://x.com/intent/post?text=${encodeURIComponent("I opened a Chog Twain walk. Pick a Chog that looks at mine and show up every day.")}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener">Post on X</a>
          </div>
          <p className="muted">The invite lasts 3 days. Only a Chog that looks at yours can join.</p>
        </div>
      </div>
    </div>
  );
}