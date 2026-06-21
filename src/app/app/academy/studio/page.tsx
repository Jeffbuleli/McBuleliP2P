import { Suspense } from "react";
import { AcademyLiveStudioClient } from "@/components/academy/academy-live-studio-client";

export const dynamic = "force-dynamic";

export default function AcademyLiveStudioPage() {
  return (
    <Suspense fallback={<p className="p-4 text-sm">…</p>}>
      <AcademyLiveStudioClient />
    </Suspense>
  );
}
