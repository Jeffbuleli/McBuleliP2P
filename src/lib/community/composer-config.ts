import type { CommunityContentKind } from "@/lib/community/post-types";
import { postTypeConfig } from "@/lib/community/post-types";

/** Categories published directly to the community feed (`community_posts`). */
export type FeedComposerKind = Extract<
  CommunityContentKind,
  "news" | "discussion" | "analysis" | "experience"
>;

export const FEED_COMPOSER_KINDS: FeedComposerKind[] = [
  "news",
  "discussion",
  "analysis",
  "experience",
];

export type ComposerPickerItem =
  | {
      mode: "feed";
      kind: FeedComposerKind;
      labelFr: string;
      labelEn: string;
      hintFr: string;
      hintEn: string;
      placeholderFr: string;
      placeholderEn: string;
      minChars: number;
    }
  | {
      mode: "redirect";
      kind: CommunityContentKind;
      href: string;
      labelFr: string;
      labelEn: string;
      hintFr: string;
      hintEn: string;
    };

export const COMPOSER_PICKER_ITEMS: ComposerPickerItem[] = [
  {
    mode: "feed",
    kind: "news",
    labelFr: "Actualité",
    labelEn: "News",
    hintFr: "Info crypto, marché, annonce",
    hintEn: "Crypto news, market, announcement",
    placeholderFr: "Partagez une actu crypto…",
    placeholderEn: "Share crypto news…",
    minChars: 20,
  },
  {
    mode: "feed",
    kind: "discussion",
    labelFr: "Discussion",
    labelEn: "Discussion",
    hintFr: "Débat court avec la communauté",
    hintEn: "Short debate with the community",
    placeholderFr: "Qu'en pensez-vous ?",
    placeholderEn: "What do you think?",
    minChars: 20,
  },
  {
    mode: "feed",
    kind: "analysis",
    labelFr: "Analyse",
    labelEn: "Analysis",
    hintFr: "Analyse marché ou projet",
    hintEn: "Market or project analysis",
    placeholderFr: "Votre analyse (min. 50 car.)…",
    placeholderEn: "Your analysis (min. 50 chars)…",
    minChars: 50,
  },
  {
    mode: "feed",
    kind: "experience",
    labelFr: "Expérience",
    labelEn: "Experience",
    hintFr: "Retour P2P, wallet, mobile money",
    hintEn: "P2P, wallet, mobile money feedback",
    placeholderFr: "Partagez votre expérience McBuleli…",
    placeholderEn: "Share your McBuleli experience…",
    minChars: 30,
  },
  {
    mode: "redirect",
    kind: "question",
    href: "/app/community/questions",
    labelFr: "Question",
    labelEn: "Question",
    hintFr: "Posez une question structurée (Q&A)",
    hintEn: "Ask a structured question (Q&A)",
  },
  {
    mode: "redirect",
    kind: "signal",
    href: "/app/community/signals",
    labelFr: "Signal trading",
    labelEn: "Trading signal",
    hintFr: "Signal éducatif avec détails",
    hintEn: "Educational signal with details",
  },
  {
    mode: "redirect",
    kind: "article",
    href: "/app/community/blogs",
    labelFr: "Article",
    labelEn: "Article",
    hintFr: "Article long format / blog",
    hintEn: "Long-form blog article",
  },
];

export function feedComposerConfig(kind: FeedComposerKind) {
  const item = COMPOSER_PICKER_ITEMS.find(
    (i) => i.mode === "feed" && i.kind === kind,
  );
  if (!item || item.mode !== "feed") {
    return COMPOSER_PICKER_ITEMS[0] as Extract<
      ComposerPickerItem,
      { mode: "feed" }
    >;
  }
  return item;
}

export function minBodyLengthForKind(kind: FeedComposerKind): number {
  return feedComposerConfig(kind).minChars;
}

export function isFeedComposerKind(v: string): v is FeedComposerKind {
  return (FEED_COMPOSER_KINDS as string[]).includes(v);
}

export function pickerChipStyle(kind: CommunityContentKind) {
  const cfg = postTypeConfig(kind);
  return { color: cfg.color, backgroundColor: cfg.bg };
}
