import type { Metadata } from "next";
import { WalkPage } from "@/components/walk/WalkPage";
import { Suspense } from "react";

export async function generateMetadata({ params }: { params: Promise<{ walkId: string }> }): Promise<Metadata> {
  const { walkId } = await params;
  return { title: `Walk ${walkId}`, openGraph: { images: [`/api/card/${walkId}`] }, twitter: { card: "summary_large_image", images: [`/api/card/${walkId}`] } };
}

export default async function Page({ params }: { params: Promise<{ walkId: string }> }) {
  const { walkId } = await params;
  const id = Number(walkId);
  return <Suspense fallback={null}><WalkPage walkId={Number.isInteger(id) && id > 0 ? id : 0} /></Suspense>;
}