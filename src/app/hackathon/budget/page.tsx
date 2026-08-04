import { HackathonBudgetClient } from "@/components/hackathon/hackathon-budget-client";
import { getFeaturedHackathon } from "@/lib/hackathon/service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partenaires & budget · Hackathon Kinshasa | McBuleli",
  description:
    "Pourquoi soutenir le Hackathon Kinshasa : places gratuites, Talks business, formation Vibe Coding, parcours Partner-Builder et budget transparent.",
  robots: { index: false, follow: false },
};

export default async function HackathonBudgetPage() {
  let buildersHeld = 14;
  try {
    const data = await getFeaturedHackathon();
    if (data?.edition.seatsTaken != null) {
      buildersHeld = data.edition.seatsTaken;
    }
  } catch {
    /* keep snapshot fallback */
  }

  return <HackathonBudgetClient buildersHeld={buildersHeld} />;
}
