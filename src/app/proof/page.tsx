import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ProofPage, type Facts } from "@/components/proof/ProofPage";

export const metadata: Metadata = { title: "Proof", description: "Addresses, invariants with test names, the fuzz finding, reverted mainnet transactions, gas and which RPC answered.", openGraph: { images: ["/og/proof"] }, twitter: { card: "summary_large_image", images: ["/og/proof"] } };

function loadFacts(): Facts | null {
  const p = join(process.cwd(), "docs", "FACTS.json");
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as Facts) : null;
}
export default function Page() { return <ProofPage facts={loadFacts()} />; }