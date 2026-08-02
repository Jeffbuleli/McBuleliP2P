export type SlideLayout =
  | "title"
  | "section"
  | "content"
  | "split"
  | "tools"
  | "steps"
  | "quiz"
  | "homework"
  | "agenda"
  | "closing";

/** Accent palette keyed per lesson / module for visual variation. */
export type SlidePalette =
  | "mint"
  | "forest"
  | "sky"
  | "indigo"
  | "amber"
  | "coral"
  | "slate"
  | "violet";

export type SlideIllustrationId =
  | "vibe-loop"
  | "ai-role"
  | "cursor"
  | "claude"
  | "codex"
  | "github"
  | "workspace"
  | "prompt-craft"
  | "idea-to-spec"
  | "build-stack"
  | "debug"
  | "git-flow"
  | "security"
  | "project"
  | "eval"
  | "quiz"
  | "homework"
  | "agenda"
  | "tools-grid"
  | "limits";

export type SlideBullet = {
  text: string;
};

export type SlideQuizOption = {
  id: string;
  text: string;
  correct?: boolean;
};

export type SlideToolCard = {
  id: string;
  name: string;
  role: string;
  accent: SlidePalette;
};

export type SlideAgendaItem = {
  num: number;
  title: string;
  subtitle: string;
  highlight?: boolean;
};

export type SlideStep = {
  num: number;
  title: string;
  body: string;
};

export type HackathonSlide = {
  id: string;
  layout: SlideLayout;
  palette: SlidePalette;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Body paragraphs (plain text). */
  body?: string[];
  /** Always rendered with leading "- ". */
  bullets?: SlideBullet[];
  illustration?: SlideIllustrationId;
  tools?: SlideToolCard[];
  agenda?: SlideAgendaItem[];
  steps?: SlideStep[];
  quiz?: {
    question: string;
    options: SlideQuizOption[];
    explanation: string;
  };
  homework?: {
    deadlineHint?: string;
    tasks: string[];
  };
  notes?: string;
  /** Footer CTA labels (closing layout). */
  ctas?: Array<{ label: string; href: string }>;
};

export type HackathonDeckMeta = {
  slug: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  moduleLabelFr: string;
  moduleLabelEn: string;
  estimatedMinutes: number;
  speakerHintFr: string;
  speakerHintEn: string;
};

export type HackathonDeck = HackathonDeckMeta & {
  slides: HackathonSlide[];
};

export type SlideSessionStatus = "idle" | "live";

export type SlideSessionPublic = {
  editionId: string;
  deckSlug: string | null;
  slideIndex: number;
  status: SlideSessionStatus;
  speakerLabel: string | null;
  updatedAt: string;
};
