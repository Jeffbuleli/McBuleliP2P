"use client";

import { useSearchParams } from "next/navigation";
import { KycFlowPanel } from "@/components/kyc/kyc-flow-panel";
import {
  isDiditSessionResumableForUi,
  normalizeDiditSessionStatus,
} from "@/lib/didit/session-status";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";

export function KycPageClient({
  userId,
  initialData,
}: {
  userId: string;
  initialData: KycStatusPayload | null;
}) {
  const searchParams = useSearchParams();
  const wantsStart = searchParams.get("start") === "1";
  const didit = normalizeDiditSessionStatus(initialData?.diditSessionStatus);
  const hasSession = Boolean(initialData?.diditSessionId?.trim());
  /** Only auto-open SDK when resuming an in-flight session — not for fresh `none` users. */
  const autoStartSdk =
    wantsStart &&
    initialData?.kycStatus === "pending" &&
    hasSession &&
    isDiditSessionResumableForUi(didit);

  return (
    <KycFlowPanel userId={userId} initialData={initialData} autoStartSdk={autoStartSdk} />
  );
}
