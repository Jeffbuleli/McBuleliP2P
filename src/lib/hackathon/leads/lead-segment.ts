/**
 * Segment assignment for personalized campaigns.
 * Uses verified facts only — no invented skills.
 */

import type { HackathonLeadSegment } from "./types";
import type { LeadScoreInput } from "./lead-score";

function haystack(input: LeadScoreInput): string {
  const parts = [
    input.location,
    input.jobTitle,
    input.company,
    input.notes,
    input.source,
    ...(input.skills ?? []),
  ];
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type SegmentRule = {
  segment: Exclude<HackathonLeadSegment, "general">;
  weight: number;
  patterns: RegExp[];
};

const RULES: SegmentRule[] = [
  {
    segment: "ai_data",
    weight: 40,
    patterns: [
      /\bai\b/,
      /\bgenai\b/,
      /\bmachine[\s-]?learning\b/,
      /\bdata\b/,
      /\bllm\b/,
      /\bnlp\b/,
      /\banalytics\b/,
      /\bintelligence artificielle\b/,
      /\bformation ia\b/,
    ],
  },
  {
    segment: "developers",
    weight: 35,
    patterns: [
      /\bsoftware\b/,
      /\bdeveloper\b/,
      /\bdeveloppeur\b/,
      /\bengineer\b/,
      /\bfull[\s-]?stack\b/,
      /\bbackend\b/,
      /\bfrontend\b/,
      /\breact\b/,
      /\bnode\b/,
      /\bcoding\b/,
      /\bdev\b/,
      /\binformatique\b/,
      /\btelecom\b/,
      /\btelecommunication\b/,
      /\bdigital\b/,
      /\bntic\b/,
    ],
  },
  {
    segment: "design_product",
    weight: 30,
    patterns: [
      /\bui\b/,
      /\bux\b/,
      /\bdesigner\b/,
      /\bfigma\b/,
      /\bproduct\b/,
      /\bproduct[\s-]?manager\b/,
      /\bproduct[\s-]?owner\b/,
      /\bfinance\b/,
      /\bbanque\b/,
      /\bmarketing\b/,
    ],
  },
  {
    segment: "entrepreneurs",
    weight: 30,
    patterns: [
      /\bstartup\b/,
      /\bentrepreneur\b/,
      /\bfounder\b/,
      /\bfondateur\b/,
      /\bcto\b/,
      /\bceo\b/,
      /\bmvp\b/,
      /\binnovation\b/,
      /\bentreprise\b/,
    ],
  },
];

export type SegmentResult = {
  segment: HackathonLeadSegment;
  reason: string;
  scores: Partial<Record<HackathonLeadSegment, number>>;
};

export function segmentLead(input: LeadScoreInput): SegmentResult {
  const text = haystack(input);
  const scores: Partial<Record<HackathonLeadSegment, number>> = {};

  for (const rule of RULES) {
    let hits = 0;
    for (const re of rule.patterns) {
      if (re.test(text)) hits += 1;
    }
    if (hits > 0) {
      scores[rule.segment] = hits * rule.weight;
    }
  }

  const ranked = (Object.entries(scores) as [HackathonLeadSegment, number][])
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    return {
      segment: "general",
      reason: "Aucun signal segment fort — message général personnalisé.",
      scores,
    };
  }

  const [segment, points] = ranked[0]!;
  const labels: Record<HackathonLeadSegment, string> = {
    developers: "Développeurs / Tech",
    ai_data: "IA / Data",
    design_product: "Design / Product",
    entrepreneurs: "Entrepreneurs / Startups / CTO",
    general: "Profils généraux",
  };

  return {
    segment,
    reason: `Segment ${labels[segment]} (signal ${points}).`,
    scores,
  };
}
