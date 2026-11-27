/** Brief ops : cinq questions, uniquement des faits déjà connus. */

export type BriefSlot = "who" | "what" | "where" | "when" | "why";

export type SituationBrief = {
  who: string;
  what: string;
  where: string;
  when: string;
  why: string;
  gaps: BriefSlot[];
};

const NOT_SAID = "Non dit";

function said(value: string | null | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return null;
  if (/^(non dit|inconnu|unknown|n\/a|—|-|\.)$/i.test(text)) return null;
  return text;
}

function clip(text: string, max = 220): string {
  return text.length <= max ? text : `${text.slice(0, max).trim()}…`;
}

export function buildSituationBrief(input: {
  sourceLabel: string;
  categoryLabel: string;
  message: string;
  createdLabel: string;
  immediateDanger: boolean;
  peopleAtRisk?: string[];
  missingInfo?: string[];
  aiWho?: string | null;
  aiWhat?: string | null;
  aiWhere?: string | null;
  aiWhen?: string | null;
  aiWhy?: string | null;
  gps: { accuracyM: number | null } | null;
  placeLabel: string | null;
  ipCity: string | null;
}): SituationBrief {
  const who =
    said(input.aiWho) ??
    (input.peopleAtRisk?.filter(Boolean).length
      ? `${input.sourceLabel} · ${input.peopleAtRisk.join(", ")}`
      : input.sourceLabel);
  const what =
    said(input.aiWhat) ??
    (input.message.trim() && input.message.trim() !== "·"
      ? `${input.categoryLabel} · ${clip(input.message.trim(), 180)}`
      : input.categoryLabel);
  const where = input.gps
    ? `GPS téléphone${
        input.gps.accuracyM != null ? ` ± ${input.gps.accuracyM} m` : ""
      }${input.placeLabel ? ` · ${input.placeLabel}` : ""}`
    : input.ipCity
      ? `Ville approximative (IP) : ${input.ipCity}. Pas le lieu exact.`
      : (said(input.aiWhere) ?? said(input.placeLabel) ?? NOT_SAID);
  const when =
    said(input.aiWhen) ??
    `${input.createdLabel}${
      input.immediateDanger ? " · danger signalé en cours" : ""
    }`;
  const why =
    said(input.aiWhy) ??
    (input.missingInfo?.filter(Boolean).length
      ? `Manque : ${input.missingInfo.slice(0, 3).join(" · ")}`
      : NOT_SAID);

  const brief: SituationBrief = { who, what, where, when, why, gaps: [] };
  if (!said(input.aiWho) && !input.peopleAtRisk?.length) brief.gaps.push("who");
  if (!input.message.trim() || input.message.trim() === "·") brief.gaps.push("what");
  if (!input.gps) brief.gaps.push("where");
  if (!said(input.aiWhen) && !input.immediateDanger) brief.gaps.push("when");
  if (why === NOT_SAID) brief.gaps.push("why");
  brief.gaps = [...new Set(brief.gaps)];
  if (input.gps) brief.gaps = brief.gaps.filter((slot) => slot !== "where");
  return brief;
}
