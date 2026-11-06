import type { TriageResult } from "@/lib/ai/triage-schema";
import { servicesForTriage } from "@/lib/response-engine/services";
import type {
  RequiredService,
  ResponseDecision,
  RoutingQueue,
} from "@/lib/response-engine/types";

/** Version politique Response Engine (audit / changelog). */
export const RESPONSE_POLICY_VERSION = "2.1.0";

export type EvaluateInput = {
  triage: TriageResult;
  source?: string;
};

const PROTECTION = [
  "vbg",
  "sexual_violence",
  "domestic_violence",
  "child_danger",
];

function isSchool(input: EvaluateInput): boolean {
  return (
    input.source === "school" ||
    input.triage.category === "school" ||
    input.triage.routing_hint === "school_referent"
  );
}

/** Assez clair et assez grave pour reveiller l'equipe. Sinon, l'IA ecoute encore. */
function pictureIsSerious(triage: TriageResult): boolean {
  return (
    triage.confidence >= 0.72 &&
    (triage.missing_info?.length ?? 0) === 0 &&
    (triage.urgency === "high" || triage.urgency === "critical")
  );
}

/**
 * L'IA recommande. Le moteur decide qui agit.
 * Danger immediat : humain tout de suite.
 * VBG, ecole, temoin, doute : comprendre d'abord. L'equipe n'est appelee
 * que lorsque le recit est grave et assez clair.
 */
export function evaluateResponse(input: EvaluateInput): ResponseDecision {
  const { triage, source } = input;
  const requiredServices = servicesForTriage(triage);
  const school = isSchool(input);
  const services = school
    ? [...new Set<RequiredService>([...requiredServices, "school_referent"])]
    : requiredServices;

  if (triage.urgency === "critical" || triage.immediate_danger) {
    return {
      queue: school ? "school_referent" : "operator_urgent",
      autoRoute: false,
      requiredServices: services,
      humanRequired: true,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "critical_or_immediate_danger",
    };
  }

  if (school || PROTECTION.includes(triage.category)) {
    if (pictureIsSerious(triage)) {
      return {
        queue: school ? "school_referent" : "operator_standard",
        autoRoute: false,
        requiredServices: services,
        humanRequired: true,
        policyVersion: RESPONSE_POLICY_VERSION,
        reason: "protection_confirmed",
      };
    }
    return {
      queue: school ? "school_referent" : "operator_standard",
      autoRoute: false,
      requiredServices: services,
      humanRequired: false,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "understand_before_act",
    };
  }

  if (source === "chat") {
    if (triage.urgency === "high") {
      return {
        queue: "operator_standard",
        autoRoute: false,
        requiredServices,
        humanRequired: false,
        policyVersion: RESPONSE_POLICY_VERSION,
        reason: "chat_ai_decides",
      };
    }
    if (["medium", "low", "info"].includes(triage.urgency)) {
      return {
        queue:
          triage.urgency === "info" ? "self_service" : "operator_standard",
        autoRoute: triage.urgency === "info",
        requiredServices,
        humanRequired: false,
        policyVersion: RESPONSE_POLICY_VERSION,
        reason: "chat_ai_accompaniment",
      };
    }
  }

  if (triage.urgency === "info" && triage.confidence >= 0.7) {
    return {
      queue: "self_service",
      autoRoute: true,
      requiredServices,
      humanRequired: false,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "info_high_confidence",
    };
  }

  if (triage.category === "infrastructure" && triage.urgency !== "high") {
    return {
      queue: "aggregated_report",
      autoRoute: true,
      requiredServices,
      humanRequired: false,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "infrastructure_aggregate",
    };
  }

  if (pictureIsSerious(triage)) {
    return {
      queue: "operator_standard",
      autoRoute: false,
      requiredServices,
      humanRequired: true,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "serious_and_clear",
    };
  }

  return {
    queue: triage.urgency === "info" ? "self_service" : "operator_standard",
    autoRoute: triage.urgency === "info" || triage.urgency === "low",
    requiredServices,
    humanRequired: false,
    policyVersion: RESPONSE_POLICY_VERSION,
    reason: "understand_before_act",
  };
}

/** Compat Phase 1 - meme forme que l'ancien applyTriageRules. */
export function applyTriageRules(triage: TriageResult): {
  queue: RoutingQueue;
  autoRoute: boolean;
} {
  const d = evaluateResponse({ triage });
  return { queue: d.queue, autoRoute: d.autoRoute };
}
