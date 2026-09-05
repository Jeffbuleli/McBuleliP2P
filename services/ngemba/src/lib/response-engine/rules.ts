import type { TriageResult } from "@/lib/ai/triage-schema";
import { servicesForTriage } from "@/lib/response-engine/services";
import type {
  RequiredService,
  ResponseDecision,
  RoutingQueue,
} from "@/lib/response-engine/types";

/** Version politique Response Engine (audit / changelog). */
export const RESPONSE_POLICY_VERSION = "2.0.0";

export type EvaluateInput = {
  triage: TriageResult;
  source?: string;
};

/**
 * IA recommande (triage) - ce module applique les regles autorisees.
 * Pas de verdict juridique. Humain requis pour files urgentes / VBG / ecole.
 */
export function evaluateResponse(input: EvaluateInput): ResponseDecision {
  const { triage, source } = input;
  const requiredServices = servicesForTriage(triage);

  if (source === "school") {
    return {
      queue: "school_referent",
      autoRoute: false,
      requiredServices: [
        ...new Set<RequiredService>([...requiredServices, "school_referent"]),
      ],
      humanRequired: true,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "source_school",
    };
  }

  if (triage.urgency === "critical" || triage.immediate_danger) {
    return {
      queue: "operator_urgent",
      autoRoute: false,
      requiredServices,
      humanRequired: true,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "critical_or_immediate_danger",
    };
  }

  if (
    ["vbg", "sexual_violence", "domestic_violence", "child_danger"].includes(
      triage.category,
    )
  ) {
    return {
      queue: "operator_standard",
      autoRoute: false,
      requiredServices,
      humanRequired: true,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "protection_category",
    };
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

  if (
    triage.category === "school" ||
    triage.routing_hint === "school_referent"
  ) {
    return {
      queue: "school_referent",
      autoRoute: false,
      requiredServices,
      humanRequired: true,
      policyVersion: RESPONSE_POLICY_VERSION,
      reason: "school_referent",
    };
  }

  return {
    queue: "operator_standard",
    autoRoute: false,
    requiredServices,
    humanRequired: true,
    policyVersion: RESPONSE_POLICY_VERSION,
    reason: "default_operator",
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
