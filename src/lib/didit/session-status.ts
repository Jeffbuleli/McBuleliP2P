/** Didit session statuses — https://docs.didit.me/integration/verification-statuses */

export const DIDIT_SESSION_STATUSES = [
  "Not Started",
  "In Progress",
  "In Review",
  "Approved",
  "Declined",
  "Resubmitted",
  "Expired",
  "Abandoned",
  "Kyc Expired",
] as const;

export type DiditSessionStatus = (typeof DIDIT_SESSION_STATUSES)[number];

export function normalizeDiditSessionStatus(
  raw: string | null | undefined,
): DiditSessionStatus | null {
  const s = raw?.trim();
  if (!s) return null;
  if ((DIDIT_SESSION_STATUSES as readonly string[]).includes(s)) {
    return s as DiditSessionStatus;
  }
  return null;
}

/** McBuleli progress rail (4 steps) aligned to Didit SDK workflow. */
export type DiditKycProgressStepId = "launch" | "id" | "liveness" | "decision";

export const DIDIT_KYC_PROGRESS_STEPS: DiditKycProgressStepId[] = [
  "launch",
  "id",
  "liveness",
  "decision",
];

/**
 * Active step index (0–3). Does not mark ID/liveness as done until Didit reports In Progress+.
 */
export function diditKycActiveStepIndex(args: {
  kycStatus: string;
  diditSessionStatus: DiditSessionStatus | null;
  hasSession: boolean;
}): number {
  const kyc = args.kycStatus;
  const d = args.diditSessionStatus;

  if (kyc === "approved") return 4;

  if (kyc === "manual_review") return 3;

  if (kyc === "pending") {
    if (d === "In Progress" || d === "Resubmitted") return 2;
    if (d === "In Review") return 3;
    if (args.hasSession) return 3;
    return 1;
  }

  if (kyc === "rejected" || kyc === "none") return 0;

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
    activeIndex === 3 &&
    diditSessionStatus !== "In Progress" &&
    diditSessionStatus !== "Resubmitted"
  ) {
    if (stepIndex === 0) return "done";
    if (stepIndex === 3) return "active";
    return "upcoming";
  }

  if (stepIndex < activeIndex) return "done";
  if (stepIndex === activeIndex) return "active";
  return "upcoming";
}
