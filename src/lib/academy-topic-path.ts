/** Visual learning path cards from program topics (no CMS). */

export type AcademyTopicSlug = "crypto" | "trading" | "ia" | "p2p";

export const ACADEMY_TOPIC_ORDER: AcademyTopicSlug[] = [
  "crypto",
  "trading",
  "ia",
  "p2p",
];

export function normalizeTopicSlug(raw: string): AcademyTopicSlug | null {
  const s = raw.trim().toLowerCase();
  if (s === "crypto") return "crypto";
  if (s === "trading") return "trading";
  if (s === "ia" || s === "ai") return "ia";
  if (s === "p2p") return "p2p";
  return null;
}

export function topicIllustration(slug: AcademyTopicSlug): string {
  return `/academy/topic-${slug === "ia" ? "ia" : slug}.svg`;
}
