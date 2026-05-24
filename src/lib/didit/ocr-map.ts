/** Extract legal identity fields from Didit decision / webhook payload. */

export type DiditOcrIdentity = {
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  documentNumber: string | null;
  documentType: string | null;
  documentCountry: string | null;
};

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

function pickIdVerification(decision: Record<string, unknown>): Record<string, unknown> | null {
  const direct = decision.id_verifications;
  if (Array.isArray(direct) && direct[0] && typeof direct[0] === "object") {
    return direct[0] as Record<string, unknown>;
  }
  const nested = decision.decision;
  if (nested && typeof nested === "object") {
    const inner = nested as Record<string, unknown>;
    const items = inner.id_verifications;
    if (Array.isArray(items) && items[0] && typeof items[0] === "object") {
      return items[0] as Record<string, unknown>;
    }
  }
  return null;
}

function normalizeBirthDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

export function extractDiditOcrIdentity(
  resource: Record<string, unknown> | null | undefined,
): DiditOcrIdentity | null {
  if (!resource) return null;

  const decision =
    resource.decision && typeof resource.decision === "object"
      ? (resource.decision as Record<string, unknown>)
      : resource;

  const idv = pickIdVerification(decision);
  if (!idv) return null;

  const firstName =
    str(idv.first_name) ??
    str(idv.given_name) ??
    str(idv.firstName);
  const lastName =
    str(idv.last_name) ??
    str(idv.surname) ??
    str(idv.lastName);
  const birthDate = normalizeBirthDate(
    str(idv.date_of_birth) ?? str(idv.birth_date) ?? str(idv.dateOfBirth),
  );
  const documentNumber =
    str(idv.document_number) ??
    str(idv.personal_number) ??
    str(idv.documentNumber);
  const documentType =
    str(idv.document_type) ?? str(idv.documentType);
  const documentCountry =
    str(idv.nationality) ??
    str(idv.issuing_country) ??
    str(idv.country) ??
    str(idv.document_country);

  if (
    !firstName &&
    !lastName &&
    !birthDate &&
    !documentNumber &&
    !documentType &&
    !documentCountry
  ) {
    return null;
  }

  return {
    firstName,
    lastName,
    birthDate,
    documentNumber,
    documentType,
    documentCountry,
  };
}

export function ocrToUserPatch(ocr: DiditOcrIdentity): {
  legalFirstName?: string;
  legalLastName?: string;
  birthDate?: string;
  documentNumber?: string;
  documentType?: string;
  documentCountry?: string;
} {
  const patch: ReturnType<typeof ocrToUserPatch> = {};
  if (ocr.firstName) patch.legalFirstName = ocr.firstName.slice(0, 128);
  if (ocr.lastName) patch.legalLastName = ocr.lastName.slice(0, 128);
  if (ocr.birthDate) patch.birthDate = ocr.birthDate;
  if (ocr.documentNumber) patch.documentNumber = ocr.documentNumber.slice(0, 64);
  if (ocr.documentType) patch.documentType = ocr.documentType.slice(0, 32);
  if (ocr.documentCountry) patch.documentCountry = ocr.documentCountry.slice(0, 8);
  return patch;
}
