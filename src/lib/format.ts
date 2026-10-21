import { formatUnits } from "viem";

export const short = (a?: string) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "");
export const num = (n: number | bigint) => Number(n).toLocaleString("en-US");

/** $CHOG amount with up to 2 decimals, thousands separators. */
export function chogAmount(wei: bigint, digits = 2): string {
  const s = formatUnits(wei, 18);
  const [i, f = ""] = s.split(".");
  const frac = f.slice(0, digits).replace(/0+$/, "");
  return Number(i).toLocaleString("en-US") + (frac ? `.${frac}` : "");
}

export function monAmount(wei: bigint, digits = 4): string {
  const s = formatUnits(wei, 18);
  const [i, f = ""] = s.split(".");
  return `${i}${f ? "." + f.slice(0, digits) : ""}`;
}

/** Seconds until the next 00:00 UTC. */
export function secondsToUtcMidnight(now = Date.now()): number {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(0, Math.floor((next - now) / 1000));
}

export function hms(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

export const pad4 = (n: number) => String(n).padStart(4, "0");

export function noteToText(hex?: string): string {
  if (!hex || /^0x0*$/.test(hex)) return "";
  const bytes = hex.slice(2).match(/.{2}/g) ?? [];
  const out: number[] = [];
  for (const b of bytes) { const v = parseInt(b, 16); if (v === 0) break; out.push(v); }
  try { return new TextDecoder().decode(new Uint8Array(out)); } catch { return ""; }
}

export function textToNote(t: string): `0x${string}` {
  const enc = new TextEncoder().encode(t);
  // 28 bytes max, never cut a multi-byte character in half
  let end = Math.min(28, enc.length);
  while (end > 0 && (enc[end] & 0xc0) === 0x80 && end < enc.length) end--;
  const slice = enc.slice(0, end);
  const hex = Array.from(slice).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex.padEnd(56, "0")}`;
}