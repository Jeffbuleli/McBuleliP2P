/** Roles ops NGEMBA - dashboards et accreditations separes. */

export type OpsRole = "admin" | "ngo" | "security" | "partner";

export type OpsPermission =
  | "alerts.list"
  | "alerts.view"
  | "alerts.patch"
  | "alerts.stats"
  | "stream.subscribe";

export const OPS_ROLE_LABELS: Record<OpsRole, string> = {
  admin: "Administrateur",
  ngo: "ONG / operateur",
  security: "Service securite",
  partner: "Partenaire",
};

const ROLE_PERMISSIONS: Record<OpsRole, OpsPermission[]> = {
  admin: [
    "alerts.list",
    "alerts.view",
    "alerts.patch",
    "alerts.stats",
    "stream.subscribe",
  ],
  ngo: ["alerts.list", "alerts.view", "alerts.patch", "stream.subscribe"],
  security: ["alerts.list", "alerts.view", "alerts.patch", "stream.subscribe"],
  partner: ["alerts.list", "alerts.view", "stream.subscribe"],
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
  return "Vue partenaire - signalements agrégés et prevention.";
}
