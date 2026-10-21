import type { Metadata } from "next";
import { Demo } from "@/components/demo/Demo";
export const metadata: Metadata = { title: "Demo", description: "The whole loop on the local rules engine with real Chog art. No wallet. Nothing on-chain." };
export default function Page() { return <Demo />; }