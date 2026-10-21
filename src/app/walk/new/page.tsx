import type { Metadata } from "next";
import { OpenWalk } from "@/components/walk/OpenWalk";

export const metadata: Metadata = { title: "Start a walk", description: "Pick a Chog, pick a distance, send the link to a friend." };
export default function Page() {
  return <OpenWalk />;
}