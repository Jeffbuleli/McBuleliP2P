import { HackathonSlidesHubClient } from "@/components/hackathon/hackathon-slides-hub-client";
import { listHackathonDecks } from "@/lib/hackathon/slides/registry";
import { getFeaturedSlideSession } from "@/lib/hackathon/slides/session";

export const dynamic = "force-dynamic";

export default async function HackathonSlidesPage() {
  let session = null;
  try {
    session = await getFeaturedSlideSession();
  } catch {
    session = null;
  }
  const decks = listHackathonDecks();
  return <HackathonSlidesHubClient decks={decks} session={session} />;
}
