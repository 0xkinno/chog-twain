import type { Metadata } from "next";
import { Demo } from "@/components/demo/Demo";
export const metadata: Metadata = { title: "Demo", description: "The whole loop on the local rules engine with real Chog art. No wallet. Nothing on-chain.", openGraph: { images: ["/og/demo"] }, twitter: { card: "summary_large_image", images: ["/og/demo"] } };
export default function Page() { return <Demo />; }