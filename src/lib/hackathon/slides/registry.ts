import { vibeCodingMasterclassDeck } from "@/lib/hackathon/slides/decks/vibe-coding-masterclass";
import type {
  HackathonDeck,
  HackathonDeckMeta,
} from "@/lib/hackathon/slides/types";

const DECKS: HackathonDeck[] = [vibeCodingMasterclassDeck];

export function listHackathonDecks(): HackathonDeckMeta[] {
  return DECKS.map((deck) => ({
    slug: deck.slug,
    titleFr: deck.titleFr,
    titleEn: deck.titleEn,
    descriptionFr: deck.descriptionFr,
    descriptionEn: deck.descriptionEn,
    moduleLabelFr: deck.moduleLabelFr,
    moduleLabelEn: deck.moduleLabelEn,
    estimatedMinutes: deck.estimatedMinutes,
    speakerHintFr: deck.speakerHintFr,
    speakerHintEn: deck.speakerHintEn,
  }));
}

export function getHackathonDeck(slug: string): HackathonDeck | null {
  const normalized = slug.trim().toLowerCase();
  return DECKS.find((d) => d.slug === normalized) ?? null;
}

export function getHackathonDeckSlide(slug: string, index: number) {
  const deck = getHackathonDeck(slug);
  if (!deck) return null;
  const safe = Math.max(0, Math.min(index, deck.slides.length - 1));
  return {
    deck,
    slide: deck.slides[safe]!,
    index: safe,
    total: deck.slides.length,
  };
}

export { vibeCodingMasterclassDeck };
