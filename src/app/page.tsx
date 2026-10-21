import { Cover } from "@/components/landing/Cover";
import { Discovery } from "@/components/landing/Discovery";
import { HowItWorks, Leaves, LanternsPledges, ProofStrip } from "@/components/landing/Sections";
import { ScrollMeet } from "@/components/landing/ScrollMeet";
import { HeartbeatPreview } from "@/components/landing/HeartbeatPreview";
import { LenisRoot } from "@/components/landing/LenisRoot";

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