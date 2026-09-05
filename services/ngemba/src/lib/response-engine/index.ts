export { evaluateResponse, applyTriageRules, RESPONSE_POLICY_VERSION } from "@/lib/response-engine/rules";
export { servicesForTriage } from "@/lib/response-engine/services";
export type {
  RequiredService,
  ResponseDecision,
  RoutingQueue,
} from "@/lib/response-engine/types";
