import { HackathonOpsHub } from "@/components/hackathon/hackathon-ops-hub";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ops jour · Hackathon McBuleli",
  robots: { index: false, follow: false },
};

export default function HackathonOpsPage() {
  return <HackathonOpsHub />;
}
