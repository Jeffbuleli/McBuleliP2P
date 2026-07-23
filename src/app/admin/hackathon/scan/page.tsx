import { redirect } from "next/navigation";
import { HackathonScanClient } from "@/components/admin/hackathon-scan-client";
import { requireStaffScope, StaffAuthError } from "@/lib/session-user";

export default async function AdminHackathonScanPage() {
  try {
    await requireStaffScope("hackathon_scan");
  } catch (e) {
    if (e instanceof StaffAuthError) redirect("/admin");
    redirect("/login");
  }
  return <HackathonScanClient />;
}
