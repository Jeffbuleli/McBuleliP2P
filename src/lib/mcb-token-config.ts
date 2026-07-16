import { REWARD_BP_PER_MCB_CLAIM } from "@/lib/reward-points-config";

export { REWARD_BP_PER_MCB_CLAIM };

export const MCB_CLAIM_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  REJECTED: "rejected",
} as const;

export type McbClaimStatus =
  (typeof MCB_CLAIM_STATUS)[keyof typeof MCB_CLAIM_STATUS];

export const MCB_CHAIN_LABEL = "BEP20 (BNB Smart Chain)";

/** BNB Smart Chain mainnet — BEP-20 tokens live here. */
export const MCB_BSC_CHAIN_ID = 56;

export const MCB_TOKEN_STANDARD = "BEP-20" as const;

/** BscScan token page for a BEP-20 contract address. */
export function mcbBscScanTokenUrl(contractAddress: string): string {
  return `https://bscscan.com/token/${contractAddress}`;
}

/** Default PancakeSwap swap URL when env omits MCB_PANCAKESWAP_URL but contract is set. */
export function mcbPancakeSwapUrlForContract(contractAddress: string): string {
  return `https://pancakeswap.finance/swap?outputCurrency=${contractAddress}`;
}

function envTruthy(v: string | undefined): boolean {
  return v === "true" || v === "1";
}

/** Server: claims accepted and BP burned. */
export function isMcbClaimEnabled(): boolean {
  return envTruthy(process.env.MCB_CLAIM_ENABLED);
}

/** UI: show claim portal (default on; set NEXT_PUBLIC_MCB_CLAIM_PREVIEW=false to hide until ready). */
export function isMcbClaimPortalVisible(): boolean {
  if (process.env.NEXT_PUBLIC_MCB_CLAIM_PREVIEW === "false") {
    return isMcbClaimEnabled();
  }
  return true;
}

export function getMcbTokenContract(): string | null {
  const v = process.env.MCB_TOKEN_CONTRACT?.trim();
  if (!v || !/^0x[a-fA-F0-9]{40}$/.test(v)) return null;
  return v;
}

export function getMcbClaimMinBp(): number {
  const n = Number(process.env.MCB_CLAIM_MIN_BP ?? REWARD_BP_PER_MCB_CLAIM);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : REWARD_BP_PER_MCB_CLAIM;
}

/** Community claim pool cap in McB (40% of 100M default). */
export function getMcbClaimPoolCapMcb(): number {
  const n = Number(process.env.MCB_CLAIM_POOL_CAP_MCB ?? 40_000_000);
  return Number.isFinite(n) && n > 0 ? n : 40_000_000;
}

/**
 * Global monthly mint cap via claim (McB). `0` = no monthly cap.
 * Pending + completed in the UTC calendar month count against this.
 */
export function getMcbClaimMonthlyGlobalCapMcb(): number {
  const n = Number(process.env.MCB_CLAIM_MONTHLY_GLOBAL_CAP_MCB ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function getMcbDexUrl(): string | null {
  const v = process.env.MCB_PANCAKESWAP_URL?.trim();
  if (v && v.startsWith("https://")) return v;
  const contract = getMcbTokenContract();
  if (contract) return mcbPancakeSwapUrlForContract(contract);
  return null;
}

export function bpToMcbAmount(bp: number): number {
  return bp / REWARD_BP_PER_MCB_CLAIM;
}

export function formatMcbAmount(bp: number): string {
  const mcb = bpToMcbAmount(bp);
  if (Number.isInteger(mcb)) return String(mcb);
  return mcb.toFixed(4).replace(/\.?0+$/, "");
}

export function getMcbClaimPublicConfig() {
  const contractAddress = getMcbTokenContract();
  return {
    preview: isMcbClaimPortalVisible(),
    enabled: isMcbClaimEnabled(),
    bpPerMcb: REWARD_BP_PER_MCB_CLAIM,
    minBp: getMcbClaimMinBp(),
    poolCapMcb: getMcbClaimPoolCapMcb(),
    monthlyGlobalCapMcb: getMcbClaimMonthlyGlobalCapMcb(),
    chainLabel: MCB_CHAIN_LABEL,
    chainId: MCB_BSC_CHAIN_ID,
    tokenStandard: MCB_TOKEN_STANDARD,
    contractAddress,
    explorerTokenUrl: contractAddress
      ? mcbBscScanTokenUrl(contractAddress)
      : null,
    dexUrl: getMcbDexUrl(),
  };
}

export type McbClaimPoolStats = {
  capMcb: number;
  mintedMcb: number;
  pendingMcb: number;
  remainingMcb: number;
  usedPercent: number;
  monthlyCapMcb: number | null;
  monthlyUsedMcb: number;
  monthlyRemainingMcb: number | null;
  claimOpen: boolean;
};

export function buildMcbClaimPoolStats(args: {
  mintedMcb: number;
  pendingMcb: number;
  monthlyUsedMcb: number;
}): McbClaimPoolStats {
  const capMcb = getMcbClaimPoolCapMcb();
  const monthlyCap = getMcbClaimMonthlyGlobalCapMcb();
  const mintedMcb = Math.max(0, args.mintedMcb);
  const pendingMcb = Math.max(0, args.pendingMcb);
  const reserved = mintedMcb + pendingMcb;
  const remainingMcb = Math.max(0, capMcb - reserved);
  const monthlyUsedMcb = Math.max(0, args.monthlyUsedMcb);
  const monthlyRemainingMcb =
    monthlyCap > 0 ? Math.max(0, monthlyCap - monthlyUsedMcb) : null;
  const effectiveRemaining =
    monthlyRemainingMcb === null
      ? remainingMcb
      : Math.min(remainingMcb, monthlyRemainingMcb);
  const usedPercent =
    capMcb > 0 ? Math.min(100, Math.round((reserved / capMcb) * 1000) / 10) : 0;

  return {
    capMcb,
    mintedMcb,
    pendingMcb,
    remainingMcb,
    usedPercent,
    monthlyCapMcb: monthlyCap > 0 ? monthlyCap : null,
    monthlyUsedMcb,
    monthlyRemainingMcb,
    claimOpen: effectiveRemaining > 0,
  };
}
