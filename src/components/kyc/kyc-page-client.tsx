"use client";

import { useSearchParams } from "next/navigation";
import { KycFlowPanel } from "@/components/kyc/kyc-flow-panel";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";

export function KycPageClient({
  userId,
  initialData,
}: {
  userId: string;
  initialData: KycStatusPayload | null;
}) {
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("start") === "1";

  return (
    <KycFlowPanel userId={userId} initialData={initialData} autoStartSdk={autoStart} />
  );
}
