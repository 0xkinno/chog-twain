"use client";
import { hms, secondsToUtcMidnight } from "@/lib/format";
import { useNow } from "@/lib/hooks";

export function Countdown({ label = "The day turns at 00:00 UTC" }: { label?: string }) {
  const now = useNow();
  const left = secondsToUtcMidnight(now);
  return (
    <div className="row" style={{ gap: 14 }} data-testid="countdown">
      <span className="display" style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontVariantNumeric: "tabular-nums", letterSpacing: ".02em" }}>{hms(left)}</span>
      <span className="mono muted">{label}</span>
    </div>
  );
}