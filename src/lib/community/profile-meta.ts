export type CommunityProfileMeta = {
  copyTradingEnabled?: boolean;
  showBotLeaderboard?: boolean;
  botTemplatesPublished?: number;
  profitSharePct?: number;
};

export function parseCommunityProfileMeta(raw: unknown): CommunityProfileMeta {
  if (!raw || typeof raw !== "object") return {};
  const m = raw as Record<string, unknown>;
  return {
    copyTradingEnabled: m.copyTradingEnabled === true,
    showBotLeaderboard: m.showBotLeaderboard === true,
    botTemplatesPublished:
      typeof m.botTemplatesPublished === "number"
        ? m.botTemplatesPublished
        : undefined,
    profitSharePct:
      typeof m.profitSharePct === "number" ? m.profitSharePct : undefined,
  };
}

export function mergeCommunityProfileMeta(
  existing: unknown,
  patch: Partial<CommunityProfileMeta>,
): CommunityProfileMeta {
  const base = parseCommunityProfileMeta(existing);
  return {
    ...base,
    ...patch,
  };
}
