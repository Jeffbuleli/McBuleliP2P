/** Visual tokens for Builders Program tiers (badge + avatar halo). */

export type BuildersTierVisual = {
  /** Chip background / text / ring classes */
  badgeClass: string;
  /** Avatar wrapper: fine colored ring + soft outer glow */
  avatarRingClass: string;
  /** Hex for inline box-shadow when class alone is not enough */
  glow: string;
  ring: string;
};

export const BUILDERS_TIER_VISUAL: Record<string, BuildersTierVisual> = {
  bronze: {
    badgeClass:
      "bg-[#f5ebe0] text-[#7a4a1e] ring-1 ring-[#c48a4a]/70",
    avatarRingClass:
      "ring-2 ring-[#c48a4a] shadow-[0_0_0_1px_rgba(196,138,74,0.35),0_0_10px_rgba(196,138,74,0.45)]",
    glow: "rgba(196,138,74,0.45)",
    ring: "#c48a4a",
  },
  silver: {
    badgeClass:
      "bg-[#eef2f6] text-[#475569] ring-1 ring-[#94a3b8]/80",
    avatarRingClass:
      "ring-2 ring-[#94a3b8] shadow-[0_0_0_1px_rgba(148,163,184,0.4),0_0_10px_rgba(148,163,184,0.5)]",
    glow: "rgba(148,163,184,0.5)",
    ring: "#94a3b8",
  },
  gold: {
    badgeClass:
      "bg-[#fbf3d8] text-[#8a6a0a] ring-1 ring-[#d4a017]/75",
    avatarRingClass:
      "ring-2 ring-[#d4a017] shadow-[0_0_0_1px_rgba(212,160,23,0.4),0_0_12px_rgba(212,160,23,0.5)]",
    glow: "rgba(212,160,23,0.5)",
    ring: "#d4a017",
  },
  diamond: {
    badgeClass:
      "bg-[#e8f7fc] text-[#0e7490] ring-1 ring-[#22d3ee]/70",
    avatarRingClass:
      "ring-2 ring-[#22d3ee] shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_12px_rgba(34,211,238,0.45)]",
    glow: "rgba(34,211,238,0.45)",
    ring: "#22d3ee",
  },
  platinum: {
    badgeClass:
      "bg-[#f8fafc] text-[#334155] ring-1 ring-[#64748b]/55",
    avatarRingClass:
      "ring-2 ring-[#e2e8f0] shadow-[0_0_0_1px_rgba(100,116,139,0.35),0_0_12px_rgba(148,163,184,0.55)]",
    glow: "rgba(148,163,184,0.55)",
    ring: "#e2e8f0",
  },
};

export function buildersTierVisual(tier: string | null | undefined): BuildersTierVisual | null {
  if (!tier) return null;
  return BUILDERS_TIER_VISUAL[tier] ?? null;
}

export function buildersAvatarRingClass(
  tier: string | null | undefined,
  fallback = "ring-2 ring-white shadow-[0_2px_8px_rgba(48,95,51,0.15)]",
): string {
  return buildersTierVisual(tier)?.avatarRingClass ?? fallback;
}
