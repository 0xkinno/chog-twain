import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChogPage } from "@/components/chog/ChogPage";
import { getChog } from "@/lib/chogs";

export async function generateMetadata({ params }: { params: Promise<{ tokenId: string }> }): Promise<Metadata> {
  const { tokenId } = await params;
  const c = getChog(Number(tokenId));
  return { title: c ? `Token ${c.id} \u00b7 CHOG #${c.art}` : "Chog not found", description: "A Chog's page: its gaze, whether it is walking, and its Friend Book." };
}
export default async function Page({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  const id = Number(tokenId);
  if (!getChog(id)) notFound();
  return <ChogPage id={id} />;
}