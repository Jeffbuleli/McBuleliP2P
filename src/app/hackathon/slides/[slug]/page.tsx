import { notFound } from "next/navigation";
import Link from "next/link";
import { HackathonSlideDeckClient } from "@/components/hackathon/hackathon-slide-deck-client";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { getHackathonDeck } from "@/lib/hackathon/slides/registry";
import { getFeaturedSlideSession } from "@/lib/hackathon/slides/session";

export const dynamic = "force-dynamic";

export default async function HackathonSlidePreparePage({
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
    <div className="min-h-dvh">
      <LandingTopBar authReturnPath={`/hackathon/slides/${deck.slug}`} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--hk-accent)]">
          Préparation speaker
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-4xl">
          {deck.titleFr}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--hk-muted)]">
          {deck.descriptionFr}
        </p>
        <HackathonSlideDeckClient
          deck={deck}
          initialSession={session}
          mode="prepare"
        />
        <p className="mt-10 text-center text-xs text-[color:var(--hk-muted)]">
          <Link
            href="/hackathon/slides"
            className="font-semibold text-[color:var(--hk-accent)] hover:underline"
          >
            ← Slides
          </Link>
        </p>
      </main>
    </div>
  );
}
