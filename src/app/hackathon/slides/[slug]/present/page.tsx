import { notFound } from "next/navigation";
import { HackathonSlideDeckClient } from "@/components/hackathon/hackathon-slide-deck-client";
import { getHackathonDeck } from "@/lib/hackathon/slides/registry";
import { getFeaturedSlideSession } from "@/lib/hackathon/slides/session";

export const dynamic = "force-dynamic";

export default async function HackathonSlidePresentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const deck = getHackathonDeck(slug);
  if (!deck) notFound();

  let session = null;
  try {
    session = await getFeaturedSlideSession();
  } catch {
    session = null;
  }

  return (
    <div className="hackathon-theme min-h-dvh">
      <HackathonSlideDeckClient
        deck={deck}
        initialSession={session}
        mode="present"
      />
    </div>
  );
}
