import type { Metadata } from "next";
import { MyWalks } from "@/components/walk/MyWalks";
export const metadata: Metadata = { title: "My walks", description: "Your walks, today's to-do, postcards and claimable $CHOG.", openGraph: { images: ["/og/me"] }, twitter: { card: "summary_large_image", images: ["/og/me"] } };
export default function Page() { return <MyWalks />; }