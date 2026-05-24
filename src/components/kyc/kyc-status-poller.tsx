"use client";

import { useEffect } from "react";
import { fetchKycStatus } from "@/lib/kyc-client-sync";

export const KYC_STATUS_CHANGED_EVENT = "kyc-status-changed";

/** Poll KYC status while pending; notifies open KYC/profile panels. */
export function KycStatusPoller() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tick, ms);
    };

    const tick = async () => {
      if (cancelled) return;
      const payload = await fetchKycStatus();
      if (cancelled || !payload) {
        schedule(120_000);
        return;
      }

      window.dispatchEvent(
        new CustomEvent(KYC_STATUS_CHANGED_EVENT, { detail: payload }),
      );

      const active =
        payload.corridor &&
        (payload.kycStatus === "pending" ||
          payload.kycStatus === "manual_review");
      schedule(active ? 10_000 : 120_000);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
