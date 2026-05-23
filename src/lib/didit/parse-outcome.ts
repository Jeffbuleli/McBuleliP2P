import type { KycVerificationOutcome } from "@/lib/kyc-service";

/** Map Didit session status strings to McBuleli outcome. */
export function parseDiditSessionStatus(
  status: string | null | undefined,
): KycVerificationOutcome {
  const s = (status ?? "").trim();
  if (s === "Approved") return "verified";
  if (s === "Declined") return "rejected";
  if (s === "In Review") return "reviewNeeded";
  if (s === "Expired" || s === "Abandoned" || s === "Kyc Expired") {
    return "abandoned";
  }
  return "unknown";
}
