import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";

import {
  isKycPendingStale,
  KYC_IN_FLIGHT_DIDIT,
} from "@/lib/kyc-stale-pending";

export type AdminKycHelpTier = "none" | "review" | "stuck" | "retry" | "legacy";

export function adminKycHelpTier(args: {
  kycStatus: string;
  kycUpdatedAt: Date | string | null;
  diditSessionStatus: string | null;
  diditSessionId: string | null;
  kycRejectionNote: string | null;
}): AdminKycHelpTier {
  const status = (args.kycStatus ?? "none").toLowerCase();
  const didit = (args.diditSessionStatus ?? "").trim();
  const hasSession = Boolean(args.diditSessionId?.trim());

  if (status === "manual_review" || didit === "In Review") return "review";
  if (status === "rejected") {
    if (isKycSanctionsRejection(args.kycRejectionNote)) return "none";
    return "retry";
  }
  if (status === "pending") {
    if (!hasSession) return "legacy";
    if (isKycPendingStale(args.kycUpdatedAt)) return "stuck";
    if (KYC_IN_FLIGHT_DIDIT.has(didit)) return "stuck";
  }
  return "none";
}

export function adminKycNeedsHelp(tier: AdminKycHelpTier): boolean {
  return tier !== "none";
}
