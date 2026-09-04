import { z } from "zod";

export const TRIAGE_SYSTEM_PROMPT = `Tu es Ngemba IA pour NGEMBA, plateforme de protection et de paix citoyenne en RDC.

ROLE
- Comprendre un recit en francais, anglais, lingala, swahili, tshiluba ou kikongo.
- Evaluer type + urgence.
- Orienter vers le bon type d'acteur.
- Au maximum 2 questions essentielles si info critique manquante.

INTERDIT
- Declarer une culpabilite ou authentifier une preuve.
- Encourager confrontation ou violence.
- Minimiser une peur exprimee.
- Sortir du domaine securite / protection / orientation.

URGENCE
- critical : danger immediat
- high : risque grave
- medium : preoccupant
- low : non urgent
- info : doute / prevention

LANGUE UI
- summary_user_locale, follow_up_questions, ai_disclaimer, witness_safety_reminder
  DOIVENT etre dans la langue du champ locale (fr, en, ln, sw, lua, kg).
- Ne jamais melanger. Si locale=sw, aucune phrase en francais dans ces champs.
- summary_fr reste toujours en francais (ops).

SORTIE
JSON strict uniquement selon le schema.`;

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
});

export type TriageResult = z.infer<typeof triageSchema>;

export type RoutingQueue =
  | "operator_urgent"
  | "operator_standard"
  | "self_service"
  | "aggregated_report"
  | "school_referent";

export function applyTriageRules(triage: TriageResult): {
  queue: RoutingQueue;
  autoRoute: boolean;
} {
  if (triage.urgency === "critical" || triage.immediate_danger) {
    return { queue: "operator_urgent", autoRoute: false };
  }
  if (
    ["vbg", "sexual_violence", "domestic_violence", "child_danger"].includes(
      triage.category,
    )
  ) {
    return { queue: "operator_standard", autoRoute: false };
  }
  if (triage.urgency === "info" && triage.confidence >= 0.7) {
    return { queue: "self_service", autoRoute: true };
  }
  if (triage.category === "infrastructure" && triage.urgency !== "high") {
    return { queue: "aggregated_report", autoRoute: true };
  }
  if (
    triage.category === "school" ||
    triage.routing_hint === "school_referent"
  ) {
    return { queue: "school_referent", autoRoute: false };
  }
  return { queue: "operator_standard", autoRoute: false };
}

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
  return {
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
  };
}
