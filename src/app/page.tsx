import { Cover } from "@/components/landing/Cover";
import dynamic from "next/dynamic";
import { HowItWorks, Leaves, LanternsPledges, ProofStrip } from "@/components/landing/Sections";

import { LenisRoot } from "@/components/landing/LenisRoot";

// below the fold: split into their own chunks so the first screen hydrates fast
const Discovery = dynamic(() => import("@/components/landing/Discovery").then((m) => m.Discovery));
const ScrollMeet = dynamic(() => import("@/components/landing/ScrollMeet").then((m) => m.ScrollMeet));
const HeartbeatPreview = dynamic(() => import("@/components/landing/HeartbeatPreview").then((m) => m.HeartbeatPreview));

export default function Home() {
  return (
    <LenisRoot>
      <Cover />
      <Discovery />
      <HowItWorks />
      <ScrollMeet />
      <Leaves />
      <LanternsPledges />
      <HeartbeatPreview />
      <ProofStrip />
    </LenisRoot>
  );
}