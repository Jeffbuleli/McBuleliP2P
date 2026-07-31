import type { Metadata } from "next";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { PartnerChatClient } from "@/components/hackathon/partner-chat-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Échange partenaires - McBuleli Hackathon",
  description:
    "Espace d'échange entre partenaires du McBuleli Hackathon : vue, roster et dialogue.",
  robots: { index: false, follow: false },
};

export default function HackathonPartnerChatPage() {
  return (
    <div className="min-h-dvh">
      <LandingTopBar authReturnPath="/hackathon/chat" />
      <PartnerChatClient />
    </div>
  );
}
