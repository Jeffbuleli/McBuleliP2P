import type { Messages } from "@/i18n/messages";

export function profileKycBadgeText(
  t: (k: keyof Messages) => string,
  kycStatus: string | null | undefined,
): string {
  const s = (kycStatus ?? "none").toLowerCase();
  if (s === "approved") return t("profile_kyc_ok");
  if (s === "pending" || s === "manual_review") return t("profile_kyc_pending");
  if (s === "rejected") return t("profile_kyc_pending");
  return t("profile_kyc_badge_off");
}
