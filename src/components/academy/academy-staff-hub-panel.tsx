"use client";

import { AcademyAdminClient } from "@/components/admin/academy-admin-client";

/** Panneau ops staff in-app — onglets inline, sans quitter /app/academy. */
export function AcademyStaffHubPanel() {
  return <AcademyAdminClient embedded />;
}
