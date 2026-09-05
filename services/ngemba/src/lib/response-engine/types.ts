/** Types du Response Engine (regles ops - pas IA). */

export type RoutingQueue =
  | "operator_urgent"
  | "operator_standard"
  | "self_service"
  | "aggregated_report"
  | "school_referent";

/** Services recommandes pour orientation / futur dispatch. */
export type RequiredService =
  | "ngo_vbg"
  | "ngo_child_protection"
  | "psychosocial"
  | "medical"
  | "ambulance"
  | "firefighters"
  | "police_info"
  | "security"
  | "school_referent"
  | "infrastructure"
  | "prevention"
  | "operator";

export type ResponseDecision = {
  queue: RoutingQueue;
  autoRoute: boolean;
  requiredServices: RequiredService[];
  humanRequired: boolean;
  /** Version politique ops (pas prompt IA). */
  policyVersion: string;
  reason: string;
};
