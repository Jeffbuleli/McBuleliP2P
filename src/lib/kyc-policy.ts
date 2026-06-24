type KycStatus = "none" | "pending" | "approved" | "rejected" | "manual_review";

export type KycGatedFeature =
  | "withdraw"
  | "deposit_fiat"
  | "wallet_transfer"
  | "p2p_trade"
  | "p2p_ad"
  | "groups"
  | "trade_live"
  | "trade_bots"
  | "community_signal";

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

/** Global Didit KYC for all profile countries (default on). Set KYC_GLOBAL=false to use corridor list. */
export function kycGlobalMode(): boolean {
  const v = String(process.env.KYC_GLOBAL ?? "true").toLowerCase().trim();
  return v !== "0" && v !== "false" && v !== "no" && v !== "off";
}

export function kycRequiredCountries(): string[] {
  const v =
    process.env.KYC_REQUIRED_COUNTRIES ?? "CD,RW,TZ,BI,UG,KE,CG,CM,NG,GH,SN,CI";
  return csvUpper(v);
}

/** User can start / complete Didit when country is set and not OTHER. */
export function kycEligibleCountry(countryCode: string | null | undefined): boolean {
  const cc = (countryCode ?? "").trim().toUpperCase();
  return Boolean(cc && cc !== "OTHER");
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
  if (!kycEligibleCountry(userCountryCode)) return false;
  if (kycGlobalMode()) return true;
  const cc = (userCountryCode ?? "").trim().toUpperCase();
  return kycRequiredCountries().includes(cc);
}

/** @deprecated Use full KYC gate via checkKycGate when KYC_ENABLED */
export function requiresKycForLargeWithdrawal(args: {
  userCountryCode?: string | null;
  netAmountUsdt: number;
}): boolean {
  if (!kycRequiredForFeature("withdraw", args.userCountryCode)) return false;
  return args.netAmountUsdt >= kycWithdrawalThresholdUsdt();
}

export type { KycStatus };
