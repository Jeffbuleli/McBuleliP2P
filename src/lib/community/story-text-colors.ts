/** Couleurs de fond autorisées pour les statuts texte (24h). */
export const COMMUNITY_STORY_TEXT_BG = [
  "#305f33",
  "#3d8f5a",
  "#229ed9",
  "#7c3aed",
  "#db2777",
] as const;

export type CommunityStoryTextBg = (typeof COMMUNITY_STORY_TEXT_BG)[number];

export function normalizeStoryTextBg(
  color: string | undefined | null,
): CommunityStoryTextBg {
  if (
    color &&
    (COMMUNITY_STORY_TEXT_BG as readonly string[]).includes(color)
  ) {
    return color as CommunityStoryTextBg;
  }
  return COMMUNITY_STORY_TEXT_BG[0];
}
