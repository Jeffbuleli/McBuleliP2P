type WarningLike = {
  short_description?: string;
  long_description?: string;
  risk?: string;
};

const FEATURE_ARRAYS = [
  "id_verifications",
  "liveness_checks",
  "face_matches",
  "aml_screenings",
  "poa_verifications",
  "nfc_verifications",
  "phone_verifications",
  "email_verifications",
  "ip_analyses",
  "database_validations",
] as const;

function collectWarnings(decision: Record<string, unknown>): string[] {
  const parts: string[] = [];
  for (const key of FEATURE_ARRAYS) {
    const items = decision[key];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const warnings = (item as { warnings?: WarningLike[] }).warnings;
      if (!Array.isArray(warnings)) continue;
      for (const w of warnings) {
        const text = w.short_description?.trim() || w.long_description?.trim();
        if (text) parts.push(text);
      }
    }
  }
  return parts;
}

export function rejectionNoteFromDiditDecision(
  decision: Record<string, unknown> | null | undefined,
): string | null {
  if (!decision) return null;
  const parts = collectWarnings(decision);
  if (parts.length) return parts.slice(0, 5).join("; ").slice(0, 500);
  return "Verification declined";
}
