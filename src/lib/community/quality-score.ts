/**
 * SUG Horizon A - Quality Score v0 (rules-only, sync).
 * Score 0-100 drives BP grant multiplier and feed ranking later.
 */

export type QualityScoreResult = {
  score: number;
  source: "rules";
  factors: Record<string, number>;
};

const SCAM_HINTS = [
  "guaranteed profit",
  "profit garanti",
  "100x",
  "free money",
  "argent gratuit",
  "send seed",
  "phrase secrète",
  "private key",
  "clé privée",
  "double your",
  "doublez vos",
  "whatsapp me",
  "dm for signal",
  "signale vip",
];

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function computeRulesQualityScore(args: {
  body: string;
  authorKycApproved: boolean;
  authorEmailVerified?: boolean;
}): QualityScoreResult {
  const body = args.body.trim();
  const len = body.length;
  const factors: Record<string, number> = {};

  // Length / structure (0-15)
  let lengthPts = 0;
  if (len >= 200) lengthPts = 15;
  else if (len >= 80) lengthPts = 12;
  else if (len >= 40) lengthPts = 8;
  else if (len >= 20) lengthPts = 5;
  else lengthPts = 2;
  factors.length = lengthPts;

  // Scam / toxic hints (0-25) - full if clean
  const lower = body.toLowerCase();
  const hit = SCAM_HINTS.some((h) => lower.includes(h));
  factors.safety = hit ? 0 : 25;

  // Identity (0-15)
  if (args.authorKycApproved) factors.identity = 15;
  else if (args.authorEmailVerified) factors.identity = 8;
  else factors.identity = 3;

  // Basic structure: has sentence break or line break (0-20) - proxy for non-spam
  const structured =
    /[.!?…]/.test(body) || body.includes("\n") || body.split(/\s+/).length >= 12;
  factors.structure = structured ? 20 : 8;

  // Reserve 25 for async AI later - give neutral mid for rules-only
  factors.ai_placeholder = 12;

  const raw =
    factors.length +
    factors.safety +
    factors.identity +
    factors.structure +
    factors.ai_placeholder;

  return {
    score: clamp(Math.round(raw), 0, 100),
    source: "rules",
    factors,
  };
}

/**
 * BP_grant = floor(base × (0.3 + 0.7 × quality/100))
 */
export function applyQualityToBpGrant(basePoints: number, qualityScore: number): number {
  if (basePoints <= 0) return 0;
  const q = clamp(qualityScore, 0, 100);
  return Math.max(1, Math.floor(basePoints * (0.3 + 0.7 * (q / 100))));
}
