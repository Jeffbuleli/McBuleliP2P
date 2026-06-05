/** Taxonomie webinar Live Studio (visuel + filtres). */
export const WEBINAR_THEMES = [
  { id: "crypto", labelFr: "Crypto", icon: "wallet" as const },
  { id: "trading", labelFr: "Trading", icon: "p2p" as const },
  { id: "ia", labelFr: "IA", icon: "tutor" as const },
  { id: "p2p", labelFr: "P2P", icon: "p2p" as const },
  { id: "business", labelFr: "Business", icon: "calendar" as const },
] as const;

export type WebinarThemeId = (typeof WEBINAR_THEMES)[number]["id"];

export const WEBINAR_SUB_THEMES: Record<
  WebinarThemeId,
  { id: string; labelFr: string }[]
> = {
  crypto: [
    { id: "wallet", labelFr: "Wallet & sécurité" },
    { id: "defi", labelFr: "DeFi" },
    { id: "onboarding", labelFr: "Premiers pas" },
  ],
  trading: [
    { id: "spot", labelFr: "Spot" },
    { id: "risk", labelFr: "Gestion du risque" },
    { id: "bots", labelFr: "Bots & automatisation" },
  ],
  ia: [
    { id: "assistant", labelFr: "Assistant IA" },
    { id: "signals", labelFr: "Signaux" },
    { id: "workflow", labelFr: "Workflows" },
  ],
  p2p: [
    { id: "escrow", labelFr: "Escrow" },
    { id: "mobile-money", labelFr: "Mobile money" },
    { id: "community", labelFr: "Communauté" },
  ],
  business: [
    { id: "webinar", labelFr: "Webinar" },
    { id: "coaching", labelFr: "Coaching" },
    { id: "formation", labelFr: "Formation" },
  ],
};

export function webinarThemeLabel(id: string): string {
  return WEBINAR_THEMES.find((t) => t.id === id)?.labelFr ?? id;
}

export function webinarSubThemeLabel(themeId: string, subId: string): string {
  return (
    WEBINAR_SUB_THEMES[themeId as WebinarThemeId]?.find((s) => s.id === subId)
      ?.labelFr ?? subId
  );
}
