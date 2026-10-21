"use client";
import type { TxState } from "@/lib/hooks";
import { explorerTx, SYMBOL } from "@/lib/chains";
import { monAmount } from "@/lib/format";

const ORDER = ["simulating", "signing", "sent", "proposed", "finalized"] as const;

/** The two-stage confirmation: landed in a block (proposed), then stamped when the block is final. */
export function TxPostmark({ tx }: { tx: TxState }) {
  const s = tx.stage;
  if (!s) return null;
  const idx = s.stage === "error" ? -1 : ORDER.indexOf(s.stage);
  return (
    <div className="postmark-panel stack" data-testid="tx-postmark" data-stage={s.stage} role="status" aria-live="polite" style={{ ["--gap" as string]: "10px" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong style={{ fontFamily: "var(--font-fredoka)" }}>{tx.label}</strong>
        <span className="mono muted">{s.stage === "finalized" ? "Postmarked" : s.stage === "error" ? "Not sent" : "In progress"}</span>
      </div>
      {tx.note && <p className="muted">{tx.note}</p>}
      <div className="steps-bar" aria-hidden>{ORDER.map((k, i) => <i key={k} className={i <= idx ? "on" : ""} />)}</div>
      {s.stage === "simulating" && <p>Checking the rules before your wallet opens.</p>}
      {s.stage === "signing" && <p>Confirm in your wallet.</p>}
      {s.stage === "sent" && <p>Sent. Waiting for a block. <a className="mono" href={explorerTx(s.hash)} rel="noopener" target="_blank">{s.hash.slice(0, 10)}...</a></p>}
      {s.stage === "proposed" && (
        <p data-testid="tx-proposed">Landed in block {s.block.toLocaleString("en-US")} (proposed) after {(s.ms / 1000).toFixed(1)} s. Waiting for finality.{" "}
          <a className="mono" href={explorerTx(s.hash)} rel="noopener" target="_blank">{s.hash.slice(0, 10)}...</a></p>
      )}
      {s.stage === "finalized" && (
        <p data-testid="tx-final">
          <strong>Postmarked.</strong> Final in {(s.msFromSend / 1000).toFixed(1)} s (block {s.block.toLocaleString("en-US")}). Fee {monAmount(s.feeWei, 6)} {SYMBOL}, {s.gasUsed.toLocaleString("en-US")} gas.{" "}
          <a className="mono" href={explorerTx(s.hash)} rel="noopener" target="_blank">{s.hash.slice(0, 10)}...</a>
        </p>
      )}
      {s.stage === "error" && (
        <p data-testid="tx-error" style={{ color: "#a02222" }}>
          {s.text}
          {s.hash && <> <a className="mono" href={explorerTx(s.hash)} rel="noopener" target="_blank">Open in explorer</a></>}
        </p>
      )}
    </div>
  );
}