import type { TriageResult } from "@/lib/ai/triage-schema";
import { normalizeTriageResult } from "@/lib/ai/triage-schema";
import { isLocale } from "@/lib/i18n";
import { citizenSummary, opsSummaryFr } from "@/lib/labels";
import type { RequiredService } from "@/lib/response-engine/types";

/**
 * Triage local (0 credit OpenAI).
 * Mots-cles FR/EN/LN/SW - toutes les sorties UI suivent la locale.
 */
export function localTriage(
  message: string,
  locale: string,
  source: string,
): TriageResult & { localConfidence: number } {
  const loc = isLocale(locale) ? locale : "fr";
  const trimmed = message.trim();

  // Media-only alert (audio/photo without text) - marker from compose UI.
  if (trimmed === "·" || trimmed.length === 0) {
    return withLocal(
      {
        category: "unknown",
        urgency: source === "sos_button" || source === "shake" ? "high" : "medium",
        immediate_danger: source === "sos_button" || source === "shake",
        summary_fr:
          "Alerte multimédia sans texte - lire audio/photos, orientation humaine.",
        summary_user_locale: mediaOnlySummary(loc),
        missing_info: [],
        routing_hint: "operator_required",
        confidence: 0.55,
        follow_up_questions: followUpsForLocale(loc),
        ai_disclaimer: disclaimerForLocale(loc),
        witness_safety_reminder:
          source === "witness" ? witnessSafetyForLocale(loc) : "",
        people_at_risk: ["personne_signalee"],
        required_services: ["operator"],
        recommended_actions: [],
      },
      0.55,
    );
  }

  const m = trimmed.toLowerCase();

  const rules: Array<{
    re: RegExp;
    category: TriageResult["category"];
    urgency: TriageResult["urgency"];
    immediate: boolean;
    routing: TriageResult["routing_hint"];
    conf: number;
    services: RequiredService[];
    people?: string[];
  }> = [
    {
      re: /\b(viol|violée|violée|sexual|mwasi|fille).{0,40}(force|menace|viol)/i,
      category: "sexual_violence",
      urgency: "critical",
      immediate: true,
      routing: "ngo_vbg",
      conf: 0.82,
      services: ["ngo_vbg", "medical", "psychosocial"],
      people: ["victime"],
    },
    {
      re: /\b(mari|époux|epoux|conjoint|boyfriend).{0,30}(menace|frappe|devant|porte|bat)/i,
      category: "domestic_violence",
      urgency: "critical",
      immediate: true,
      routing: "ngo_vbg",
      conf: 0.8,
      services: ["ngo_vbg", "psychosocial"],
      people: ["victime"],
    },
    {
      re: /\b(vbg|violence conjugale|domestic)/i,
      category: "vbg",
      urgency: "high",
      immediate: false,
      routing: "ngo_vbg",
      conf: 0.75,
      services: ["ngo_vbg", "psychosocial"],
    },
    {
      re: /\b(enfant|mwana|mtoto).{0,40}(danger|frapp|abus|viol)/i,
      category: "child_danger",
      urgency: "critical",
      immediate: true,
      routing: "ngo_child_protection",
      conf: 0.8,
      services: ["ngo_child_protection", "psychosocial"],
      people: ["enfant"],
    },
    {
      re: /\b(accident|renversé|renverse|voiture|moto|blessé|blesse)/i,
      category: "accident",
      urgency: "high",
      immediate: true,
      routing: "medical_info_only",
      conf: 0.78,
      services: ["medical", "ambulance"],
      people: ["blesse"],
    },
    {
      re: /\b(incendie|feu|motoi|moto ya|fire)/i,
      category: "fire",
      urgency: "critical",
      immediate: true,
      routing: "emergency_info_only",
      conf: 0.8,
      services: ["firefighters", "ambulance"],
    },
    {
      re: /\b(inondation|flood|mai ebele)/i,
      category: "flood",
      urgency: "high",
      immediate: false,
      routing: "emergency_info_only",
      conf: 0.75,
      services: ["firefighters", "operator"],
    },
    {
      re: /\b(vol|braquage|arme|agression|robbery|assault)/i,
      category: "assault",
      urgency: "high",
      immediate: true,
      routing: "operator_required",
      conf: 0.72,
      services: ["security", "police_info", "medical"],
    },
    {
      re: /\b(harcelement|harcèlement|cyber|photos? (intimes|nues)|chantage)/i,
      category: "harassment",
      urgency: "medium",
      immediate: false,
      routing: "ngo_vbg",
      conf: 0.7,
      services: ["ngo_vbg", "prevention"],
    },
    {
      re: /\b(escroquerie|arnaque|scam|phishing)/i,
      category: "scam",
      urgency: "medium",
      immediate: false,
      routing: "prevention_resources",
      conf: 0.7,
      services: ["prevention"],
    },
    {
      re: /\b(eclairage|éclairage|trou|route|infrastructure)/i,
      category: "infrastructure",
      urgency: "low",
      immediate: false,
      routing: "infrastructure_report",
      conf: 0.72,
      services: ["infrastructure"],
    },
    {
      re: /\b(peur|doute|normal\?|je ne sais pas|afraid|hatari\?)/i,
      category: "other",
      urgency: "info",
      immediate: false,
      routing: "prevention_resources",
      conf: 0.55,
      services: ["prevention"],
    },
    {
      re: /\b(danger|aide|urgence|mort|sang|menace|mbila|hatari|likama|zingu)/i,
      category: "unknown",
      urgency: "high",
      immediate: true,
      routing: "operator_required",
      conf: 0.65,
      services: ["operator"],
      people: ["personne_signalee"],
    },
  ];

  for (const rule of rules) {
    if (rule.re.test(m)) {
      return withLocal(
        {
          category: rule.category,
          urgency: rule.urgency,
          immediate_danger: rule.immediate,
          summary_fr: opsSummaryFr(rule.category, rule.urgency),
          summary_user_locale: citizenSummary(
            isLocale(locale) ? locale : "fr",
            rule.category,
            rule.urgency,
            true,
          ),
          missing_info: [],
          routing_hint: rule.routing,
          confidence: rule.conf,
          follow_up_questions: [],
          ai_disclaimer: disclaimerForLocale(locale),
          witness_safety_reminder:
            source === "witness" ? witnessSafetyForLocale(locale) : "",
          people_at_risk: rule.people ?? [],
          required_services: rule.services,
          recommended_actions: [],
        },
        rule.conf,
      );
    }
  }

  return withLocal(
    {
      category: "unknown",
      urgency: "medium",
      immediate_danger: false,
      summary_fr: opsSummaryFr("unknown", "medium"),
      summary_user_locale: citizenSummary(
        isLocale(locale) ? locale : "fr",
        "unknown",
        "medium",
        false,
      ),
      missing_info: missingInfoForLocale(locale),
      routing_hint: "operator_required",
      confidence: 0.4,
      follow_up_questions: followUpsForLocale(locale),
      ai_disclaimer: disclaimerForLocale(locale),
      witness_safety_reminder:
        source === "witness" ? witnessSafetyForLocale(locale) : "",
      required_services: ["operator"],
    },
    0.4,
  );
}

function withLocal(
  partial: Parameters<typeof normalizeTriageResult>[0],
  localConfidence: number,
): TriageResult & { localConfidence: number } {
  return { ...normalizeTriageResult(partial), localConfidence };
}

function followUpsForLocale(locale: string): string[] {
  if (locale === "en") {
    return ["Are you safe right now?", "Where are you?"];
  }
  if (locale === "sw") {
    return ["Uko salama sasa?", "Uko wapi?"];
  }
  if (locale === "ln") {
    return ["Ozali na bomoi sikoyo?", "Ozali wapi?"];
  }
  if (locale === "lua") {
    return ["Udi mu lushindama nunku?", "Udi kupi?"];
  }
  if (locale === "kg") {
    return ["Nge kele na luvuvamu bubu?", "Nge kele wapi?"];
  }
  return ["Êtes-vous en sécurité maintenant ?", "Où êtes-vous ?"];
}

function missingInfoForLocale(locale: string): string[] {
  if (locale === "en") {
    return ["place details", "exact nature of the danger"];
  }
  if (locale === "sw") {
    return ["maelezo ya eneo", "aina halisi ya hatari"];
  }
  if (locale === "ln") {
    return ["esika na yango", "lolenge ya likama"];
  }
  if (locale === "lua") {
    return ["kala", "mutindu wa dikama"];
  }
  if (locale === "kg") {
    return ["kisika", "mutindu ya zingu"];
  }
  return ["précision sur le lieu", "nature exacte du danger"];
}

function disclaimerForLocale(locale: string): string {
  if (locale === "en") {
    return "Automatic NGEMBA assessment (local) - not verified by a human. Not legal evidence.";
  }
  if (locale === "sw") {
    return "Tathmini ya kiotomatiki NGEMBA (ya ndani) - haijathibitishwa na mtu. Si ushahidi wa kisheria.";
  }
  if (locale === "ln") {
    return "Evaluation automatique NGEMBA (locale) - moto atali yango te. Ezali preuve judiciaire te.";
  }
  if (locale === "lua") {
    return "Evaluation automatique NGEMBA - muntu kechi umona. Kechi preuve judiciaire.";
  }
  if (locale === "kg") {
    return "Evaluation automatique NGEMBA - muntu me tala ve. Kele preuve judiciaire ve.";
  }
  return "Évaluation automatique NGEMBA (locale) - non vérifiée par un humain. Ne constitue pas une preuve judiciaire.";
}

function mediaOnlySummary(locale: string): string {
  if (locale === "en") {
    return "Media alert (audio or photo) - Ngemba IA orients, a human reviews the case.";
  }
  if (locale === "sw") {
    return "Tahadhari ya media - Ngemba IA inaongoza, binadamu anasoma.";
  }
  if (locale === "ln" || locale === "kg") {
    return "Alerte ya audio/photo - Ngemba IA azongisa, moto akotanga.";
  }
  if (locale === "lua") {
    return "Alerte ya audio/photo - Ngemba IA, muntu udi umona.";
  }
  return "Alerte multimédia (audio ou photo) - Ngemba IA oriente, un humain lit le dossier.";
}

function witnessSafetyForLocale(locale: string): string {
  if (locale === "en") {
    return "Do not put yourself in danger. Report only.";
  }
  if (locale === "sw") {
    return "Usijiweke hatarini. Ripoti tu.";
  }
  if (locale === "ln") {
    return "Kotia yo te na likama. Yebisa kaka.";
  }
  if (locale === "lua") {
    return "Ke ika wewe mu dikama. Ambila kenyeka.";
  }
  if (locale === "kg") {
    return "Kutula nge ve na zingu. Zabisa kaka.";
  }
  return "Ne vous mettez pas en danger. Signalez seulement.";
}
