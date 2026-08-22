import { HackathonInfosClient } from "@/components/hackathon/hackathon-infos-client";

export const metadata = {
  title: "Infos pratiques - McBuleli Hackathon",
  description:
    "Lieu, horaires, matériel, WiFi et déroulé - McBuleli Hackathon Kinshasa 2026.",
  robots: { index: true, follow: true },
};

export default function HackathonInfosPage() {
  return <HackathonInfosClient />;
}
