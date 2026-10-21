import "server-only";
/** Bagel Fat One for next/og, fetched from our own static files (satori reads woff, not woff2). */
let cached: ArrayBuffer | null = null;
export async function bagel(origin: string): Promise<ArrayBuffer | null> {
  if (cached) return cached;
  try {
    const r = await fetch(`${origin}/fonts/bagel.woff`);
    if (!r.ok) return null;
    cached = await r.arrayBuffer();
    return cached;
  } catch {
    return null;
  }
}