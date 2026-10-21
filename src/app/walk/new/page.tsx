import type { Metadata } from "next";
import { OpenWalk } from "@/components/walk/OpenWalk";

export const metadata: Metadata = { title: "Start a walk", description: "Pick a Chog, pick a distance, send the link to a friend.", openGraph: { images: ["/og/walk"] }, twitter: { card: "summary_large_image", images: ["/og/walk"] } };
export default function Page() {
  return <OpenWalk />;
}