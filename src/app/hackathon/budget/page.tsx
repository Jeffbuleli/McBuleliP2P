import { HackathonBudgetClient } from "@/components/hackathon/hackathon-budget-client";
import { getFeaturedHackathon } from "@/lib/hackathon/service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Budget prévisionnel · Hackathon Kinshasa | McBuleli",
  description:
    "Prévision budgétaire Hackathon Kinshasa 28–29 août 2026 — salles, restauration, ops.",
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
