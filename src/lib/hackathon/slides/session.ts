import { eq } from "drizzle-orm";
import { getDb, hackathonSlideSessions } from "@/db";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { getHackathonDeck } from "@/lib/hackathon/slides/registry";
import type {
  SlideSessionPublic,
  SlideSessionStatus,
} from "@/lib/hackathon/slides/types";

function toPublic(
  row: typeof hackathonSlideSessions.$inferSelect,
): SlideSessionPublic {
  const status: SlideSessionStatus =
    row.status === "live" ? "live" : "idle";
  return {
    editionId: row.editionId,
    deckSlug: row.deckSlug,
    slideIndex: row.slideIndex,
    status,
    speakerLabel: row.speakerLabel,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSlideSessionForEdition(
  editionId: string,
): Promise<SlideSessionPublic | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonSlideSessions)
    .where(eq(hackathonSlideSessions.editionId, editionId))
    .limit(1);
  return row ? toPublic(row) : null;
}

export async function getFeaturedSlideSession(): Promise<SlideSessionPublic | null> {
  const edition = await getFeaturedEditionRow();
  if (!edition) return null;
  const existing = await getSlideSessionForEdition(edition.id);
  if (existing) return existing;
  return {
    editionId: edition.id,
    deckSlug: null,
    slideIndex: 0,
    status: "idle",
    speakerLabel: null,
    updatedAt: new Date().toISOString(),
  };
}

async function upsertSession(input: {
  editionId: string;
  deckSlug: string | null;
  slideIndex: number;
  status: SlideSessionStatus;
  speakerLabel: string | null;
  userId: string | null;
}): Promise<SlideSessionPublic> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(hackathonSlideSessions)
    .values({
      editionId: input.editionId,
      deckSlug: input.deckSlug,
      slideIndex: input.slideIndex,
      status: input.status,
      speakerLabel: input.speakerLabel,
      updatedByUserId: input.userId,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: hackathonSlideSessions.editionId,
      set: {
        deckSlug: input.deckSlug,
        slideIndex: input.slideIndex,
        status: input.status,
        speakerLabel: input.speakerLabel,
        updatedByUserId: input.userId,
        updatedAt: now,
      },
    })
    .returning();
  if (!row) throw new Error("slide_session_upsert_failed");
  return toPublic(row);
}

export async function goLiveSlideSession(input: {
  editionId: string;
  deckSlug: string;
  slideIndex?: number;
  speakerLabel: string;
  userId: string;
}): Promise<SlideSessionPublic> {
  const deck = getHackathonDeck(input.deckSlug);
  if (!deck) throw new Error("deck_not_found");
  const max = deck.slides.length - 1;
  const index = Math.max(0, Math.min(input.slideIndex ?? 0, max));
  return upsertSession({
    editionId: input.editionId,
    deckSlug: deck.slug,
    slideIndex: index,
    status: "live",
    speakerLabel: input.speakerLabel.slice(0, 160),
    userId: input.userId,
  });
}

export async function setSlideSessionIndex(input: {
  editionId: string;
  slideIndex: number;
  userId: string;
}): Promise<SlideSessionPublic> {
  const current = await getSlideSessionForEdition(input.editionId);
  if (!current?.deckSlug || current.status !== "live") {
    throw new Error("not_live");
  }
  const deck = getHackathonDeck(current.deckSlug);
  if (!deck) throw new Error("deck_not_found");
  const max = deck.slides.length - 1;
  const index = Math.max(0, Math.min(input.slideIndex, max));
  return upsertSession({
    editionId: input.editionId,
    deckSlug: current.deckSlug,
    slideIndex: index,
    status: "live",
    speakerLabel: current.speakerLabel,
    userId: input.userId,
  });
}

export async function endSlideSession(input: {
  editionId: string;
  userId: string;
}): Promise<SlideSessionPublic> {
  const current = await getSlideSessionForEdition(input.editionId);
  return upsertSession({
    editionId: input.editionId,
    deckSlug: current?.deckSlug ?? null,
    slideIndex: current?.slideIndex ?? 0,
    status: "idle",
    speakerLabel: current?.speakerLabel ?? null,
    userId: input.userId,
  });
}

/** Presentation payload for the live wall projector mode. */
export async function getLivePresentationPayload() {
  const session = await getFeaturedSlideSession();
  if (!session || session.status !== "live" || !session.deckSlug) {
    return null;
  }
  const deck = getHackathonDeck(session.deckSlug);
  if (!deck) return null;
  const index = Math.max(
    0,
    Math.min(session.slideIndex, deck.slides.length - 1),
  );
  const slide = deck.slides[index]!;
  return {
    status: "live" as const,
    deckSlug: deck.slug,
    deckTitleFr: deck.titleFr,
    deckTitleEn: deck.titleEn,
    slideIndex: index,
    totalSlides: deck.slides.length,
    speakerLabel: session.speakerLabel,
    slide,
    updatedAt: session.updatedAt,
  };
}
