export type SchoolConcernType =
  | "harassment"
  | "violence"
  | "abuse"
  | "cyber"
  | "other";

export type SchoolContext = {
  concernType: SchoolConcernType;
  establishmentHint: string | null;
  isMinor: true;
};

export function normalizeSchoolContext(raw: unknown): SchoolContext | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const concern = row.concernType;
  const valid: SchoolConcernType[] = [
    "harassment",
    "violence",
    "abuse",
    "cyber",
    "other",
  ];
  if (typeof concern !== "string" || !valid.includes(concern as SchoolConcernType)) {
    return null;
  }
  const establishmentHint =
    typeof row.establishmentHint === "string"
      ? row.establishmentHint.trim().slice(0, 120) || null
      : null;
  return {
    concernType: concern as SchoolConcernType,
    establishmentHint,
    isMinor: true,
  };
}

export const SCHOOL_CONCERN_LABELS_FR: Record<SchoolConcernType, string> = {
  harassment: "Harcèlement",
  violence: "Violence",
  abuse: "Abus / comportement inapproprié",
  cyber: "Cyberharcèlement",
  other: "Autre signalement",
};
