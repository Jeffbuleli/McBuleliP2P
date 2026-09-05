import type { TriageResult } from "@/lib/ai/triage-schema";
import type { RequiredService } from "@/lib/response-engine/types";

/** Mapping categorie / hint → services (moteur, pas modele). */
export function servicesForTriage(triage: TriageResult): RequiredService[] {
  if (triage.required_services?.length) {
    return [...new Set(triage.required_services)] as RequiredService[];
  }

  const out: RequiredService[] = [];
  const cat = triage.category;
  const hint = triage.routing_hint;

  if (
    cat === "vbg" ||
    cat === "sexual_violence" ||
    cat === "domestic_violence" ||
    hint === "ngo_vbg"
  ) {
    out.push("ngo_vbg", "psychosocial");
    if (cat === "sexual_violence" || triage.immediate_danger) {
      out.push("medical");
    }
  }

  if (cat === "child_danger" || hint === "ngo_child_protection") {
    out.push("ngo_child_protection", "psychosocial");
  }

  if (cat === "medical" || cat === "accident" || hint === "medical_info_only") {
    out.push("medical", "ambulance");
  }

  if (cat === "fire") {
    out.push("firefighters", "ambulance");
  }

  if (cat === "flood") {
    out.push("firefighters", "operator");
  }

  if (cat === "assault" || cat === "robbery") {
    out.push("security", "police_info", "medical");
  }

  if (cat === "harassment" || cat === "cyber_threat") {
    out.push("ngo_vbg", "prevention");
  }

  if (cat === "scam") {
    out.push("prevention");
  }

  if (
    cat === "infrastructure" ||
    cat === "lighting" ||
    hint === "infrastructure_report"
  ) {
    out.push("infrastructure");
  }

  if (cat === "school" || hint === "school_referent") {
    out.push("school_referent");
  }

  if (hint === "prevention_resources") {
    out.push("prevention");
  }

  if (hint === "emergency_info_only") {
    out.push("operator", "police_info");
  }

  if (!out.length) {
    out.push("operator");
  }

  return [...new Set(out)];
}
