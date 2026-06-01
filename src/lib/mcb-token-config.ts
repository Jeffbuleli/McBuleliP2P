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

export function getMcbDexUrl(): string | null {
  const v = process.env.MCB_PANCAKESWAP_URL?.trim();
  return v && v.startsWith("https://") ? v : null;
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
  return {
    preview: isMcbClaimPortalVisible(),
    enabled: isMcbClaimEnabled(),
    bpPerMcb: REWARD_BP_PER_MCB_CLAIM,
    minBp: getMcbClaimMinBp(),
    chainLabel: MCB_CHAIN_LABEL,
    contractAddress: getMcbTokenContract(),
    dexUrl: getMcbDexUrl(),
  };
}
