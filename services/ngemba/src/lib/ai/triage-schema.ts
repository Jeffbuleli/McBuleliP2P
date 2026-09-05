import { z } from "zod";
import type { RequiredService } from "@/lib/response-engine/types";

/** Version prompt / schema IA (audit, A/B, rollback). */
export const TRIAGE_PROMPT_VERSION = "2.0.0";
export const TRIAGE_SCHEMA_VERSION = "2";

export const TRIAGE_SYSTEM_PROMPT = `Tu es Ngemba IA pour NGEMBA, plateforme de protection et de paix citoyenne en RDC.
Prompt version: ${TRIAGE_PROMPT_VERSION}

ROLE
- Comprendre un recit en francais, anglais, lingala, swahili, tshiluba ou kikongo.
- Evaluer type + urgence + personnes a risque + services utiles.
- Orienter vers le bon type d'acteur.
- Au maximum 2 questions essentielles si info critique manquante.

INTERDIT
- Declarer une culpabilite ou authentifier une preuve.
- Encourager confrontation ou violence.
- Minimiser une peur exprimee.
- Sortir du domaine securite / protection / orientation.
- Inventer des faits absents du recit.

URGENCE
- critical : danger immediat
- high : risque grave
- medium : preoccupant
- low : non urgent
- info : doute / prevention

SERVICES (required_services) - choisir parmi :
ngo_vbg, ngo_child_protection, psychosocial, medical, ambulance,
firefighters, police_info, security, school_referent, infrastructure,
prevention, operator

LANGUE UI
- summary_user_locale, follow_up_questions, ai_disclaimer, witness_safety_reminder,
  recommended_actions DOIVENT etre dans la langue du champ locale (fr, en, ln, sw, lua, kg).
- Ne jamais melanger. Si locale=sw, aucune phrase en francais dans ces champs.
- summary_fr reste toujours en francais (ops).

SORTIE
JSON strict uniquement selon le schema. Inclure schema_version="${TRIAGE_SCHEMA_VERSION}".
L'IA recommande seulement - les regles ops decidront la file.`;

export const requiredServiceEnum = z.enum([
  "ngo_vbg",
  "ngo_child_protection",
  "psychosocial",
  "medical",
  "ambulance",
  "firefighters",
  "police_info",
  "security",
  "school_referent",
  "infrastructure",
  "prevention",
  "operator",
]);

export const triageSchema = z.object({
  category: z.enum([
    "vbg",
    "sexual_violence",
    "domestic_violence",
    "child_danger",
    "assault",
    "robbery",
    "accident",
    "medical",
    "fire",
    "flood",
    "infrastructure",
    "lighting",
    "cyber_threat",
    "scam",
    "harassment",
    "school",
    "other",
    "unknown",
  ]),
  urgency: z.enum(["critical", "high", "medium", "low", "info"]),
  immediate_danger: z.boolean(),
  summary_fr: z.string(),
  summary_user_locale: z.string(),
  missing_info: z.array(z.string()).max(3),
  routing_hint: z.enum([
    "ngo_vbg",
    "ngo_child_protection",
    "emergency_info_only",
    "medical_info_only",
    "infrastructure_report",
    "prevention_resources",
    "school_referent",
    "operator_required",
  ]),
  confidence: z.number().min(0).max(1),
  follow_up_questions: z.array(z.string()).max(2),
  ai_disclaimer: z.string(),
  witness_safety_reminder: z.string(),
  /** Phase 2 - optionnels pour compat payloads v1. */
  people_at_risk: z.array(z.string()).max(5).optional().default([]),
  location_hints: z.array(z.string()).max(5).optional().default([]),
  required_services: z.array(requiredServiceEnum).max(6).optional().default([]),
  recommended_actions: z.array(z.string()).max(5).optional().default([]),
  schema_version: z.string().optional().default(TRIAGE_SCHEMA_VERSION),
  /** Rempli par le pipeline apres Response Engine (audit). */
  prompt_version: z.string().optional(),
  engine_policy_version: z.string().optional(),
  engine_reason: z.string().optional(),
  engine_human_required: z.boolean().optional(),
});

export type TriageResult = z.infer<typeof triageSchema>;

/** Normalise un payload partiel (v1 ou OpenAI incomplet) vers TriageResult v2. */
export function normalizeTriageResult(
  raw: Partial<TriageResult> &
    Pick<
      TriageResult,
      | "category"
      | "urgency"
      | "immediate_danger"
      | "summary_fr"
      | "summary_user_locale"
      | "missing_info"
      | "routing_hint"
      | "confidence"
      | "follow_up_questions"
      | "ai_disclaimer"
      | "witness_safety_reminder"
    >,
): TriageResult {
  const parsed = triageSchema.safeParse({
    people_at_risk: [],
    location_hints: [],
    required_services: [],
    recommended_actions: [],
    schema_version: TRIAGE_SCHEMA_VERSION,
    ...raw,
  });
  if (parsed.success) return parsed.data;
  return {
    category: raw.category,
    urgency: raw.urgency,
    immediate_danger: raw.immediate_danger,
    summary_fr: raw.summary_fr,
    summary_user_locale: raw.summary_user_locale,
    missing_info: raw.missing_info ?? [],
    routing_hint: raw.routing_hint,
    confidence: raw.confidence,
    follow_up_questions: raw.follow_up_questions ?? [],
    ai_disclaimer: raw.ai_disclaimer,
    witness_safety_reminder: raw.witness_safety_reminder ?? "",
    people_at_risk: raw.people_at_risk ?? [],
    location_hints: raw.location_hints ?? [],
    required_services: (raw.required_services ?? []) as RequiredService[],
    recommended_actions: raw.recommended_actions ?? [],
    schema_version: raw.schema_version ?? TRIAGE_SCHEMA_VERSION,
  };
}

/** @deprecated Importer RoutingQueue depuis @/lib/response-engine */
export type { RoutingQueue } from "@/lib/response-engine/types";

const CRITICAL_KEYWORDS =
  /\b(danger|aide|mort|sang|viol|menace|agresse|tue|urgence|mbila|hatari|likama)\b/i;

function fallbackSummary(locale: string): string {
  if (locale === "en") {
    return "Alert saved. Limited automatic review - a human will check.";
  }
  if (locale === "sw") {
    return "Tahadhari imehifadhiwa. Ukaguzi mdogo - mtu ataangalia.";
  }
  if (locale === "ln") {
    return "Alerte ezwami. Evaluation moke - moto akokengela.";
  }
  if (locale === "lua") {
    return "Alerte yapokwa. Evaluation moke - muntu ukemonanga.";
  }
  if (locale === "kg") {
    return "Alerte me bakama. Evaluation fioti - muntu ta tala.";
  }
  return "Alerte enregistrée. Connexion IA limitée - un humain va vérifier.";
}

function fallbackDisclaimer(locale: string): string {
  if (locale === "en") {
    return "Automatic NGEMBA assessment - not verified by a human. Not legal evidence.";
  }
  if (locale === "sw") {
    return "Tathmini ya kiotomatiki NGEMBA - haijathibitishwa na mtu. Si ushahidi wa kisheria.";
  }
  if (locale === "ln") {
    return "Evaluation automatique NGEMBA - moto atali yango te. Ezali preuve judiciaire te.";
  }
  if (locale === "lua") {
    return "Evaluation automatique NGEMBA - muntu kechi umona. Kechi preuve judiciaire.";
  }
  if (locale === "kg") {
    return "Evaluation automatique NGEMBA - muntu me tala ve. Kele preuve judiciaire ve.";
  }
  return "Évaluation automatique NGEMBA - non vérifiée par un humain. Ne constitue pas une preuve judiciaire.";
}

function fallbackWitness(locale: string): string {
  if (locale === "en") return "Do not put yourself in danger. Report only.";
  if (locale === "sw") return "Usijiweke hatarini. Ripoti tu.";
  if (locale === "ln") return "Kotia yo te na likama. Yebisa kaka.";
  if (locale === "lua") return "Ke ika wewe mu dikama. Ambila kenyeka.";
  if (locale === "kg") return "Kutula nge ve na zingu. Zabisa kaka.";
  return "Ne vous mettez pas en danger. Signalez seulement.";
}

export function fallbackTriage(
  message: string,
  locale: string,
  source: string,
): TriageResult {
  const critical = CRITICAL_KEYWORDS.test(message);
  return normalizeTriageResult({
    category: "unknown",
    urgency: critical ? "high" : "medium",
    immediate_danger: critical,
    summary_fr:
      "Alerte enregistrée. Évaluation automatique limitée - un humain doit vérifier.",
    summary_user_locale: fallbackSummary(locale),
    missing_info: [],
    routing_hint: "operator_required",
    confidence: 0.35,
    follow_up_questions: [],
    ai_disclaimer: fallbackDisclaimer(locale),
    witness_safety_reminder:
      source === "witness" ? fallbackWitness(locale) : "",
    people_at_risk: critical ? ["personne_signalee"] : [],
    location_hints: [],
    required_services: ["operator"],
    recommended_actions: [],
  });
}
