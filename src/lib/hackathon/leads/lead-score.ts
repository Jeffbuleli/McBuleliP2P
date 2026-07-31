/**
 * Deterministic lead scoring (0–100) from verified profile facts only.
 * Never invents skills or experience.
 */

import type { HackathonLeadScoreBreakdown } from "@/db/schema";
import {
  categoryFromScore,
  HACKATHON_SCORE_POINTS,
  priorityFromCategory,
  type HackathonLeadCategory,
  type HackathonLeadPriority,
  type HackathonScoreCriterionKey,
} from "./types";

export type LeadScoreInput = {
  location?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  skills?: string[] | null;
  notes?: string | null;
  experienceYears?: number | null;
  source?: string | null;
  linkedinUrl?: string | null;
};

const CRITERION_LABELS: Record<HackathonScoreCriterionKey, string> = {
  kinshasa: "Basé à Kinshasa (critère prioritaire)",
  developer: "Équipe technique / logiciel / digital / télécom",
  ai_data: "IA / Data / GenAI",
  ai_tools: "Outils IA (Cursor, Claude, ChatGPT, Copilot…)",
  hackathon_exp: "Expérience hackathon / challenge tech",
  startup: "Startup / innovation / MVP / entrepreneuriat",
  recent_activity: "Source récente (annuaire, FEC, csv, community…)",
  experience_1_7: "Ancienneté organisation (1–20 ans)",
  design_product: "Entreprise / SI / métier (PME ou grande — pas forcément tech)",
};

function haystack(input: LeadScoreInput): string {
  const parts = [
    input.location,
    input.jobTitle,
    input.company,
    input.notes,
    input.source,
    input.linkedinUrl,
    ...(input.skills ?? []),
  ];
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

const KINSHASA_RE = [
  /\bkinshasa\b/,
  /\bkin\b/,
  /\bgombe\b/,
  /\blimete\b/,
  /\bngaliema\b/,
  /\bmasina\b/,
  /\bkalamu\b/,
  /\brdc\b/,
  /\bcd\b/,
  /\bcongo\b/,
  /\bdrcongo\b/,
  /\bdr congo\b/,
];

const DEVELOPER_RE = [
  /\bsoftware\b/,
  /\bdeveloper\b/,
  /\bdeveloppeur\b/,
  /\bdev\b/,
  /\bengineer\b/,
  /\bingenieur\b/,
  /\bfull[\s-]?stack\b/,
  /\bbackend\b/,
  /\bfrontend\b/,
  /\bmobile\b/,
  /\bandroid\b/,
  /\bios\b/,
  /\breact\b/,
  /\bnode\b/,
  /\bpython\b/,
  /\bjava\b/,
  /\btypescript\b/,
  /\bjavascript\b/,
  /\bcoding\b/,
  /\bprogrammer\b/,
  /\bprogrammeur\b/,
  // B2B / annuaire sectors (IT desks that can learn AI tooling)
  /\binformatique\b/,
  /\bntic\b/,
  /\btic\b/,
  /\bdigital\b/,
  /\btelecom\b/,
  /\btelecommunication\b/,
  /\blogiciel\b/,
  /\bsysteme\b/,
  /\berp\b/,
  /\bcloud\b/,
  /\breseau\b/,
  /\bcyber\b/,
  /\bweb\b/,
  /\bit\b/,
  /\bfintech\b/,
  /\bapi\b/,
  /\bsaas\b/,
];

const AI_DATA_RE = [
  /\bai\b/,
  /\bgenai\b/,
  /\bgenerative\b/,
  /\bmachine[\s-]?learning\b/,
  /\bml\b/,
  /\bdeep[\s-]?learning\b/,
  /\bnlp\b/,
  /\bllm\b/,
  /\bdata\b/,
  /\bdatascience\b/,
  /\bdata[\s-]?scientist\b/,
  /\bdata[\s-]?engineer\b/,
  /\banalytics\b/,
  /\bautomatisation\b/,
  /\bautomation\b/,
  /\bintelligence artificielle\b/,
];

const AI_TOOLS_RE = [
  /\bcursor\b/,
  /\bclaude\b/,
  /\bchatgpt\b/,
  /\bgpt[\s-]?4\b/,
  /\bgithub[\s-]?copilot\b/,
  /\bcopilot\b/,
  /\bcodex\b/,
  /\bvibe[\s-]?coding\b/,
  /\bmidjourney\b/,
  /\bstable[\s-]?diffusion\b/,
];

const HACKATHON_RE = [
  /\bhackathon\b/,
  /\bchallenge\b/,
  /\bcompetition\b/,
  /\bcompetiton\b/,
  /\bcontest\b/,
  /\bbootcamp\b/,
  /\bhackday\b/,
  /\bcoding[\s-]?challenge\b/,
];

const STARTUP_RE = [
  /\bstartup\b/,
  /\bstart[\s-]?up\b/,
  /\bentrepreneur\b/,
  /\bentrepreneuriat\b/,
  /\bmvp\b/,
  /\binnovation\b/,
  /\bfounder\b/,
  /\bfondateur\b/,
  /\bco[\s-]?founder\b/,
  /\bcto\b/,
  /\bceo\b/,
  /\bincubateur\b/,
  /\bincubator\b/,
];

const DESIGN_PRODUCT_RE = [
  /\bui\b/,
  /\bux\b/,
  /\bui\/ux\b/,
  /\bdesigner\b/,
  /\bdesign\b/,
  /\bproduct\b/,
  /\bproduct[\s-]?manager\b/,
  /\bproduct[\s-]?owner\b/,
  /\bpm\b/,
  /\bfigma\b/,
  /\bbusiness\b/,
  /\bmarketing\b/,
  /\bgrowth\b/,
  /\bfinance\b/,
  /\bfinances\b/,
  /\bbanque\b/,
  /\bbank\b/,
  /\bassurance\b/,
  /\bservices\b/,
  /\bentreprise\b/,
  // Non-tech orgs that run information systems
  /\bpme\b/,
  /\bsi\b/,
  /\berp\b/,
  /\bsap\b/,
  /\bsysteme\b/,
  /\binformation\b/,
  /\bmetier\b/,
  /\bindustrie\b/,
  /\bcommerce\b/,
  /\bmines\b/,
  /\blogistique\b/,
  /\btransport\b/,
  /\benergie\b/,
  /\bhotel\b/,
  /\bong\b/,
];

const RECENT_SOURCES = new Set([
  "linkedin",
  "community",
  "ambassador",
  "university",
  "company",
  "annuaire",
  "fec",
  "directory",
  "csv",
  "xlsx",
  "manual",
]);

function matchCriterion(
  key: HackathonScoreCriterionKey,
  input: LeadScoreInput,
  text: string,
): boolean {
  switch (key) {
    case "kinshasa":
      return includesAny(text, KINSHASA_RE);
    case "developer":
      return includesAny(text, DEVELOPER_RE);
    case "ai_data":
      return includesAny(text, AI_DATA_RE);
    case "ai_tools":
      return includesAny(text, AI_TOOLS_RE);
    case "hackathon_exp":
      return includesAny(text, HACKATHON_RE);
    case "startup":
      return includesAny(text, STARTUP_RE);
    case "recent_activity": {
      const src = (input.source ?? "").toLowerCase().trim();
      if (RECENT_SOURCES.has(src)) return true;
      if (input.linkedinUrl && /linkedin\.com/i.test(input.linkedinUrl)) {
        return true;
      }
      return false;
    }
    case "experience_1_7": {
      // Broader band for company registries (still capped for junior/mid desks).
      const y = input.experienceYears;
      return typeof y === "number" && y >= 1 && y <= 20;
    }
    case "design_product":
      return includesAny(text, DESIGN_PRODUCT_RE);
    default:
      return false;
  }
}

export type LeadScoreResult = {
  score: number;
  breakdown: HackathonLeadScoreBreakdown;
  category: HackathonLeadCategory;
  priority: HackathonLeadPriority;
  qualificationReason: string;
  recommendedProfile: string;
};

export function scoreLead(input: LeadScoreInput): LeadScoreResult {
  const text = haystack(input);
  const criteria: HackathonLeadScoreBreakdown["criteria"] = [];

  for (const key of Object.keys(
    HACKATHON_SCORE_POINTS,
  ) as HackathonScoreCriterionKey[]) {
    if (!matchCriterion(key, input, text)) continue;
    criteria.push({
      key,
      label: CRITERION_LABELS[key],
      points: HACKATHON_SCORE_POINTS[key],
    });
  }

  const score = Math.min(
    100,
    criteria.reduce((sum, c) => sum + c.points, 0),
  );
  const category = categoryFromScore(score);
  const priority = priorityFromCategory(category);

  const qualificationReason =
    criteria.length === 0
      ? "Aucun critère vérifié dans les données fournies — profil à enrichir."
      : `Score ${score}/100 : ${criteria.map((c) => `${c.label} (+${c.points})`).join(" ; ")}.`;

  const recommendedProfile = recommendProfile(
    criteria.map((c) => c.key as HackathonScoreCriterionKey),
    text,
  );

  return {
    score,
    breakdown: { total: score, criteria },
    category,
    priority,
    qualificationReason,
    recommendedProfile,
  };
}

function recommendProfile(
  matched: HackathonScoreCriterionKey[],
  text: string,
): string {
  const set = new Set(matched);
  if (set.has("ai_data") && set.has("developer")) {
    return "Builder IA / full-stack technique";
  }
  if (set.has("developer")) return "Développeur / Vibe Coding";
  if (set.has("ai_data")) return "Profil IA / Data";
  if (set.has("design_product")) return "Design / Product";
  if (set.has("startup")) return "Entrepreneur / startup tech";
  if (includesAny(text, DEVELOPER_RE)) return "Profil technique";
  return "Profil général qualifié";
}
