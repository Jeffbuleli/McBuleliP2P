import { McStageDisplay } from "@/components/hackathon/mc-stage-display";
import { getMcSession, toMcPublic } from "@/lib/hackathon/mc-state";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scène · McBuleli AI MC",
  robots: { index: false, follow: false },
};

export default function HackathonMcStagePage() {
  const session = toMcPublic(getMcSession());
  return <McStageDisplay initialSession={session} />;
}
