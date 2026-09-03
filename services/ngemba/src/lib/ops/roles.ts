/** Roles ops NGEMBA - dashboards et accreditations separes. */

export type OpsRole = "admin" | "ngo" | "security" | "partner" | "school";

export type OpsPermission =
  | "alerts.list"
  | "alerts.view"
  | "alerts.patch"
  | "alerts.stats"
  | "stream.subscribe"
  | "observatory.view"
  | "observatory.export";

export const OPS_ROLE_LABELS: Record<OpsRole, string> = {
  admin: "Administrateur",
  ngo: "ONG / operateur",
  security: "Service securite",
  partner: "Partenaire",
  school: "Referent ecole",
};

const ROLE_PERMISSIONS: Record<OpsRole, OpsPermission[]> = {
  admin: [
    "alerts.list",
    "alerts.view",
    "alerts.patch",
    "alerts.stats",
    "stream.subscribe",
    "observatory.view",
    "observatory.export",
  ],
  ngo: [
    "alerts.list",
    "alerts.view",
    "alerts.patch",
    "stream.subscribe",
    "observatory.view",
  ],
  security: [
    "alerts.list",
    "alerts.view",
    "alerts.patch",
    "stream.subscribe",
    "observatory.view",
  ],
  partner: [
    "alerts.list",
    "alerts.view",
    "stream.subscribe",
    "observatory.view",
    "observatory.export",
  ],
  school: ["alerts.list", "alerts.view", "alerts.patch", "stream.subscribe"],
};

export function roleHasPermission(
  role: OpsRole,
  permission: OpsPermission,
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Filtre file selon le role (meme store, vues differentes). */
export function sessionVisibleToRole(
  role: OpsRole,
  session: {
    urgency: string;
    category: string;
    routingQueue: string;
  },
): boolean {
  if (role === "admin") return true;

  if (role === "ngo") {
    return (
      ["operator_urgent", "operator_standard", "school_referent"].includes(
        session.routingQueue,
      ) ||
      [
        "vbg",
        "sexual_violence",
        "domestic_violence",
        "child_danger",
        "harassment",
        "school",
        "unknown",
        "other",
      ].includes(session.category)
    );
  }

  if (role === "security") {
    return (
      ["critical", "high"].includes(session.urgency) ||
      [
        "assault",
        "robbery",
        "fire",
        "flood",
        "accident",
        "medical",
        "child_danger",
        "unknown",
      ].includes(session.category)
    );
  }

  // partner - signalements non urgents / agrégés
  if (role === "partner") {
    return (
      session.routingQueue === "aggregated_report" ||
      session.urgency === "low" ||
      session.urgency === "info" ||
      session.category === "infrastructure"
    );
  }

  // school - uniquement file Safe School / category school
  if (role === "school") {
    return (
      session.routingQueue === "school_referent" ||
      session.category === "school" ||
      session.category === "child_danger"
    );
  }

  return false;
}

export function dashboardHint(role: OpsRole): string {
  if (role === "admin") {
    return "Vue d'ensemble - toutes les alertes et files.";
  }
  if (role === "ngo") {
    return "File ONG - alertes citoyennes a orienter.";
  }
  if (role === "security") {
    return "File urgence - situations critiques et securite.";
  }
  if (role === "school") {
    return "File Safe School - signalements eleves et mineurs.";
  }
  return "Vue partenaire - signalements agrégés et prevention.";
}
