import type { MetamapVerificationOutcome } from "@/lib/kyc-service";

/** Map MetaMap identityStatus / status strings to McBuleli outcome. */
export function parseMetamapIdentityStatus(
  identityStatus: string | null | undefined,
  status?: string | null | undefined,
): MetamapVerificationOutcome {
  const s = (identityStatus ?? status ?? "").toString().toLowerCase();
  const compact = s.replace(/[^a-z0-9]/g, "");
  if (s === "verified" || compact === "verified") return "verified";
  if (
    s === "reviewneeded" ||
    s === "review_needed" ||
    compact === "reviewneeded"
  ) {
    return "reviewNeeded";
  }
  if (s === "rejected" || compact === "rejected") return "rejected";
  return "unknown";
}
