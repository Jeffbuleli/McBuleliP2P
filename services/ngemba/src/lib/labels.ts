import type { Locale } from "@/lib/i18n";
import type { TriageResult } from "@/lib/ai/triage-schema";
import type { RoutingQueue } from "@/lib/ai/triage-schema";

const CATEGORY_FR: Record<TriageResult["category"], string> = {
  vbg: "Violence basee sur le genre",
  sexual_violence: "Violence sexuelle",
  domestic_violence: "Violence conjugale",
  child_danger: "Enfant en danger",
  assault: "Agression",
  robbery: "Vol / braquage",
  accident: "Accident",
  medical: "Urgence médicale",
  fire: "Incendie",
  flood: "Inondation",
  infrastructure: "Infrastructure / voirie",
  lighting: "Éclairage public",
  cyber_threat: "Menace numérique",
  scam: "Arnaque / escroquerie",
  harassment: "Harcèlement",
  school: "École / mineur",
  other: "Autre signalement",
  unknown: "Situation à clarifier",
};

const URGENCY_FR: Record<TriageResult["urgency"], string> = {
  critical: "Critique",
  high: "Élevée",
  medium: "Modérée",
  low: "Faible",
  info: "Information",
};

const STATUS_FR: Record<string, string> = {
  opened: "Ouverte",
  active: "Active",
  oriented: "Prise en charge",
  closed: "Clôturée",
  cancelled: "Annulée",
};

const SOURCE_FR: Record<string, string> = {
  sos_button: "SOS",
  witness: "Témoin",
  chat: "Chat",
  shake: "Secousse",
  school: "Safe School",
};

const ROUTING_FR: Record<RoutingQueue, string> = {
  operator_urgent: "Opérateur urgent",
  operator_standard: "Opérateur standard",
  self_service: "Auto-orientation",
  aggregated_report: "Signalement agrégé",
  school_referent: "Référent école",
};

const LOCATION_SOURCE_FR: Record<string, string> = {
  geoapify: "GPS (Geoapify)",
  gps_offline: "GPS (estimation)",
  place: "Choix manuel",
};

const URGENCY_I18N: Record<Locale, Record<TriageResult["urgency"], string>> = {
  fr: URGENCY_FR,
  en: {
    critical: "Critical",
    high: "High",
    medium: "Moderate",
    low: "Low",
    info: "Info",
  },
  ln: {
    critical: "Likama mingi",
    high: "Likama",
    medium: "Kati-kati",
    low: "Moke",
    info: "Lisolo",
  },
  sw: {
    critical: "Hatari kubwa",
    high: "Hatari",
    medium: "Wastani",
    low: "Chini",
    info: "Taarifa",
  },
  lua: {
    critical: "Dikama dikulu",
    high: "Dikama",
    medium: "Kati",
    low: "Fioti",
    info: "Maloba",
  },
  kg: {
    critical: "Zingu ya nene",
    high: "Zingu",
    medium: "Kati",
    low: "Fioti",
    info: "Nsangu",
  },
};

export function categoryLabelFr(category: string): string {
  return CATEGORY_FR[category as TriageResult["category"]] ?? "Situation à clarifier";
}

export function urgencyLabelFr(urgency: string): string {
  return URGENCY_FR[urgency as TriageResult["urgency"]] ?? urgency;
}

export function urgencyLabel(urgency: string, locale: Locale = "fr"): string {
  return (
    URGENCY_I18N[locale]?.[urgency as TriageResult["urgency"]] ??
    urgencyLabelFr(urgency)
  );
}

export function statusLabelFr(status: string): string {
  return STATUS_FR[status] ?? status;
}

export function sourceLabelFr(source: string): string {
  return SOURCE_FR[source] ?? source;
}

export function routingLabelFr(queue: string): string {
  return ROUTING_FR[queue as RoutingQueue] ?? queue;
}

export function locationSourceLabelFr(source: string | null): string {
  if (!source) return "";
  return LOCATION_SOURCE_FR[source] ?? source;
}

export function providerLabelFr(provider: string): string {
  if (provider === "openai") return "IA OpenAI";
  if (provider === "local") return "Analyse locale";
  return provider;
}

/** Resume citoyen - sans codes techniques entre parentheses. */
export function citizenSummary(
  locale: Locale,
  category: TriageResult["category"],
  urgency: TriageResult["urgency"],
  matched = false,
): string {
  if (locale === "en") {
    if (!matched) {
      return "Alert received. A human will review your situation.";
    }
    return `Alert received - ${categoryLabelEn(category)}. A human will review.`;
  }
  if (locale === "sw") {
    if (!matched) {
      return "Tahadhari imepokelewa. Mtu ataangalia hali yako.";
    }
    return `Tahadhari imepokelewa - ${categoryLabelEn(category)}. Mtu ataangalia.`;
  }
  if (locale === "ln") {
    if (!matched) {
      return "Alerte ezwami. Moto akokengela situation na yo.";
    }
    return `Alerte ezwami - ${categoryLabelFr(category)}. Moto akokengela.`;
  }
  if (locale === "lua") {
    if (!matched) {
      return "Alerte yapokwa. Muntu ukemonanga situation.";
    }
    return `Alerte yapokwa - ${categoryLabelFr(category)}. Muntu ukemonanga.`;
  }
  if (locale === "kg") {
    if (!matched) {
      return "Alerte me bakama. Muntu ta tala situation na nge.";
    }
    return `Alerte me bakama - ${categoryLabelFr(category)}. Muntu ta tala.`;
  }
  if (!matched) {
    return "Alerte enregistrée. Un humain va vérifier votre situation.";
  }
  return `Signalement reçu - ${categoryLabelFr(category)} (${urgencyLabelFr(urgency)}). Un humain va vérifier.`;
}

function categoryLabelEn(category: TriageResult["category"]): string {
  const map: Partial<Record<TriageResult["category"], string>> = {
    unknown: "situation to clarify",
    sexual_violence: "possible sexual violence",
    domestic_violence: "possible domestic violence",
    child_danger: "child in danger",
    assault: "assault",
    fire: "fire",
    flood: "flood",
    accident: "accident",
    harassment: "harassment",
    scam: "scam",
    infrastructure: "infrastructure issue",
    other: "other report",
    vbg: "gender-based violence",
  };
  return map[category] ?? "report";
}

/** Resume ops (toujours FR, lisible). */
export function opsSummaryFr(
  category: TriageResult["category"],
  urgency: TriageResult["urgency"],
): string {
  return `${categoryLabelFr(category)} - urgence ${urgencyLabelFr(urgency)}. À vérifier par un opérateur.`;
}
