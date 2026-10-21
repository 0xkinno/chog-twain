import type { Metadata } from "next";
import { HeartbeatPage } from "@/components/heartbeat/HeartbeatPage";
export const metadata: Metadata = { title: "Heartbeat", description: "Live numbers from the contract: steps, meetings, lanterns, pledges." };
export default function Page() { return <HeartbeatPage />; }