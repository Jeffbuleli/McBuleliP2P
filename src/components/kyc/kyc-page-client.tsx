"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KycIdentityCorrectionPanel } from "@/components/kyc/kyc-identity-correction-panel";
import { KycFlowPanel } from "@/components/kyc/kyc-flow-panel";
import { fetchKycStatus } from "@/lib/kyc-client-sync";
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
  const [data, setData] = useState<KycStatusPayload | null>(initialData);
  const wantsStart = searchParams.get("start") === "1";
  const didit = normalizeDiditSessionStatus(data?.diditSessionStatus);
  const hasSession = Boolean(data?.diditSessionId?.trim());
  const autoStartSdk =
    wantsStart &&
    (data?.kycStatus === "none" ||
      (data?.kycStatus === "pending" &&
        hasSession &&
        isDiditSessionResumableForUi(didit)));

  const refresh = useCallback(async () => {
    const payload = await fetchKycStatus();
    if (payload) setData(payload);
  }, []);

  return (
    <>
      <KycFlowPanel
        userId={userId}
        initialData={data}
        autoStartSdk={autoStartSdk}
        onDataChange={setData}
      />
      {data ? <KycIdentityCorrectionPanel data={data} onUpdated={refresh} /> : null}
    </>
  );
}
