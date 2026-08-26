import type { Metadata } from "next";
import { KinshasaQuizForm } from "@/components/hackathon/kinshasa-quiz-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promo Kinshasa - place gratuite | McBuleli Hackathon",
  description:
    "Quiz informatique (10 QCM en 9 min, 70 %) pour une place gratuite. Places limitées. Ticket QR par e-mail si réussi.",
  robots: { index: false, follow: false },
};

export default async function KinshasaPromoPage({
  searchParams,
}: {
  searchParams: Promise<{ utm_source?: string; ref?: string }>;
}) {
  const sp = await searchParams;
  const utmSource = sp.utm_source || sp.ref || null;

  return <KinshasaQuizForm utmSource={utmSource} />;
}
