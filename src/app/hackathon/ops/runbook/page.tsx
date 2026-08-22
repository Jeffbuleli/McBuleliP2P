import { HackathonRunbookClient } from "@/components/hackathon/hackathon-runbook-client";

export const metadata = {
  title: "Runbook ops - McBuleli Hackathon",
  robots: { index: false, follow: false },
};

export default function HackathonOpsRunbookPage() {
  return <HackathonRunbookClient />;
}
