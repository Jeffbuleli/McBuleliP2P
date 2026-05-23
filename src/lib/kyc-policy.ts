type KycStatus = "none" | "pending" | "approved" | "rejected" | "manual_review";

export type KycGatedFeature =
  | "withdraw"
  | "deposit_fiat"
  | "wallet_transfer"
  | "p2p_trade"
  | "p2p_ad"
  | "groups"
  | "trade_live"
  | "trade_bots";

function csvUpper(s: string | undefined): string[] {
  return (s ?? "")
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean);
}

export function kycEnabled(): boolean {
  const v = String(process.env.KYC_ENABLED ?? "false").toLowerCase().trim();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function kycRequiredCountries(): string[] {
  const v =
    process.env.KYC_REQUIRED_COUNTRIES ?? "CD,RW,TZ,BI,UG,KE,CG,CM,NG,GH,SN,CI";
  return csvUpper(v);
}

export function kycWithdrawalThresholdUsdt(): number {
  const raw = Number(process.env.KYC_WITHDRAWAL_THRESHOLD_USDT ?? "500");
  return Number.isFinite(raw) && raw > 0 ? raw : 500;
}

export function isKycApproved(status: string | null | undefined): boolean {
  return (status ?? "none") === "approved";
}

export function kycRequiredForFeature(
  _feature: KycGatedFeature,
  userCountryCode?: string | null,
): boolean {
  if (!kycEnabled()) return false;
  const cc = (userCountryCode ?? "").trim().toUpperCase();
  if (!cc || cc === "OTHER") return false;
  return kycRequiredCountries().includes(cc);
}

/** @deprecated Use full KYC gate via checkKycGate when KYC_ENABLED */
export function requiresKycForLargeWithdrawal(args: {
  userCountryCode?: string | null;
  netAmountUsdt: number;
}): boolean {
  if (!kycEnabled()) return false;
  const cc = (args.userCountryCode ?? "").trim().toUpperCase();
  if (!cc) return false;
  if (!kycRequiredCountries().includes(cc)) return false;
  return args.netAmountUsdt >= kycWithdrawalThresholdUsdt();
}

export type { KycStatus };
