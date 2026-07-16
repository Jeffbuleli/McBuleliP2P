/** SUG Horizon A - Utility Tags for feed posts. */

export const UTILITY_TAGS = [
  "learn",
  "trade_edu",
  "avec",
  "p2p",
  "local",
  "create",
  "signal",
] as const;

export type UtilityTag = (typeof UTILITY_TAGS)[number];

export type UtilityTagMeta = {
  tag: UtilityTag;
  labelFr: string;
  labelEn: string;
};

export const UTILITY_TAG_META: UtilityTagMeta[] = [
  { tag: "learn", labelFr: "Apprendre", labelEn: "Learn" },
  { tag: "trade_edu", labelFr: "Trading (éducatif)", labelEn: "Trade (edu)" },
  { tag: "avec", labelFr: "AVEC", labelEn: "Group savings" },
  { tag: "p2p", labelFr: "P2P", labelEn: "P2P" },
  { tag: "local", labelFr: "Vie locale", labelEn: "Local life" },
  { tag: "create", labelFr: "Création", labelEn: "Create" },
  { tag: "signal", labelFr: "Signal", labelEn: "Signal" },
];

export function isUtilityTag(v: string): v is UtilityTag {
  return (UTILITY_TAGS as readonly string[]).includes(v);
}

/** Default tag from legacy content_kind when user does not pick one. */
export function utilityTagFromContentKind(kind: string): UtilityTag {
  switch (kind) {
    case "news":
      return "local";
    case "discussion":
      return "create";
    case "analysis":
      return "trade_edu";
    case "experience":
      return "p2p";
    case "formation":
      return "learn";
    case "signal":
      return "signal";
    default:
      return "create";
  }
}

export function utilityTagLabel(tag: string, fr: boolean): string {
  const meta = UTILITY_TAG_META.find((m) => m.tag === tag);
  if (!meta) return tag;
  return fr ? meta.labelFr : meta.labelEn;
}
