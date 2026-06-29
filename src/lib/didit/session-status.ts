/** McBuleli KYC UI steps - OCR in SDK (no manual profile form). */

export type KycUiStepId = "id" | "liveness" | "decision";

export const KYC_UI_STEPS: KycUiStepId[] = ["id", "liveness", "decision"];

export type DiditSessionStatus =
  | "Not Started"
  | "In Progress"
  | "Awaiting User"
  | "In Review"
  | "Approved"
  | "Declined"
  | "Resubmitted"
  | "Expired"
  | "Abandoned"
  | "Kyc Expired";

const KNOWN = new Set<string>([
  "Not Started",
  "In Progress",
  "Awaiting User",
  "In Review",
  "Approved",
  "Declined",
  "Resubmitted",
  "Expired",
  "Abandoned",
  "Kyc Expired",
]);

export function normalizeDiditSessionStatus(
  raw: string | null | undefined,
): DiditSessionStatus | null {
  const s = raw?.trim();
  if (!s || !KNOWN.has(s)) return null;
  return s as DiditSessionStatus;
}

/** Active step index 0=id, 1=selfie, 2=decision; 3=all done. */
export function diditKycActiveStepIndex(args: {
  kycStatus: string;
  diditSessionStatus: DiditSessionStatus | null;
  hasSession: boolean;
}): number {
  const kyc = args.kycStatus;
  const d = args.diditSessionStatus;

  if (kyc === "approved") return 3;
  if (kyc === "manual_review") return 2;

  if (kyc === "pending") {
    if (d === "In Progress" || d === "Resubmitted" || d === "Awaiting User") return 1;
    if (d === "In Review") return 2;
    if (d === "Not Started") return 0;
    if (args.hasSession) return 0;
    return 0;
  }

  return 0;
}

export function diditKycStepState(
  stepIndex: number,
  activeIndex: number,
  kycStatus: string,
  diditSessionStatus: DiditSessionStatus | null,
): "done" | "active" | "upcoming" {
  if (kycStatus === "approved") return "done";

  if (
    kycStatus === "pending" &&
    activeIndex === 2 &&
    diditSessionStatus !== "In Progress" &&
    diditSessionStatus !== "Resubmitted" &&
    diditSessionStatus !== "Awaiting User"
  ) {
    if (stepIndex < 2) return "done";
    if (stepIndex === 2) return "active";
    return "upcoming";
  }

  if (stepIndex < activeIndex) return "done";
  if (stepIndex === activeIndex) return "active";
  return "upcoming";
}

export function isAwaitingDiditDecision(args: {
  kycStatus: string;
  diditSessionStatus: DiditSessionStatus | null;
  hasSession?: boolean;
}): boolean {
  if (args.kycStatus === "manual_review") return true;
  if (args.kycStatus !== "pending") return false;
  return args.diditSessionStatus === "In Review";
}

export function isDiditSessionResumableForUi(
  diditSessionStatus: DiditSessionStatus | null,
): boolean {
  return (
    diditSessionStatus === "Not Started" ||
    diditSessionStatus === "In Progress" ||
    diditSessionStatus === "Resubmitted" ||
    diditSessionStatus === "Awaiting User" ||
    diditSessionStatus === null
  );
}

export function isDiditSdkActive(args: {
  kycStatus: string;
  diditSessionStatus: DiditSessionStatus | null;
  hasSession: boolean;
}): boolean {
  if (args.kycStatus !== "pending") return false;
  if (!args.hasSession) return false;
  return isDiditSessionResumableForUi(args.diditSessionStatus);
}
