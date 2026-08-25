/** Public tool logos for bootcamp slides. */
export const HACKATHON_TOOL_LOGOS: Record<string, string> = {
  cursor: "/hackathon/tools/cursor.svg",
  claude: "/hackathon/tools/claude.svg",
  codex: "/hackathon/tools/codex.svg",
  github: "/hackathon/tools/github.svg",
};

export function hackathonToolLogoSrc(
  idOrName: string | null | undefined,
): string | null {
  if (!idOrName) return null;
  const key = idOrName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return HACKATHON_TOOL_LOGOS[key] ?? null;
}
