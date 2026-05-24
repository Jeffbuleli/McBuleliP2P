import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";

export type AdminKycHelpTier = "none" | "review" | "stuck" | "retry";

const STUCK_MS = 48 * 60 * 60 * 1000;

export function adminKycHelpTier(args: {
  kycStatus: string;
  kycUpdatedAt: Date | string | null;
  diditSessionStatus: string | null;
  kycRejectionNote: string | null;
}): AdminKycHelpTier {
  const status = (args.kycStatus ?? "none").toLowerCase();
  const didit = (args.diditSessionStatus ?? "").trim();

  if (status === "manual_review" || didit === "In Review") return "review";
  if (status === "rejected") {
    if (isKycSanctionsRejection(args.kycRejectionNote)) return "none";
    return "retry";
  }
  if (status === "pending") {
    const at = args.kycUpdatedAt ? new Date(args.kycUpdatedAt).getTime() : 0;
    if (at && Date.now() - at > STUCK_MS) return "stuck";
    if (
      didit === "Awaiting User" ||
      didit === "Resubmitted" ||
      didit === "Not Started"
    ) {
      return "stuck";
    }
  }
  return "none";
}

export function adminKycNeedsHelp(tier: AdminKycHelpTier): boolean {
  return tier !== "none";
}
