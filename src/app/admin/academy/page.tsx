import { Suspense } from "react";
import { AcademyAdminClient } from "@/components/admin/academy-admin-client";

export default function AdminAcademyPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm">…</p>}>
      <AcademyAdminClient />
    </Suspense>
  );
}
