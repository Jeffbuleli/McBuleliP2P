import type { MetamapVerificationOutcome } from "@/lib/kyc-service";

/** Map MetaMap identityStatus / status strings to McBuleli outcome. */
export function parseMetamapIdentityStatus(
  identityStatus: string | null | undefined,
  status?: string | null | undefined,
): MetamapVerificationOutcome {
  const s = (identityStatus ?? status ?? "").toString().toLowerCase();
  if (s === "verified") return "verified";
  if (s === "reviewneeded" || s === "review_needed") return "reviewNeeded";
  if (s === "rejected") return "rejected";
  return "unknown";
}
