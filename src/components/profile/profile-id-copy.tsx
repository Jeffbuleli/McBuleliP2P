"use client";

import { useState } from "react";
import type { Messages } from "@/i18n/messages";

export function ProfileIdCopy({
  id,
  copyLabel,
  copiedLabel,
}: {
  id: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [done, setDone] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(id);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="shrink-0 rounded-lg border border-stone-600 bg-stone-900/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-200 transition hover:border-emerald-600/50 hover:text-emerald-300"
    >
      {done ? copiedLabel : copyLabel}
    </button>
  );
}

export function profileKycBadgeText(
  t: (k: keyof Messages) => string,
  kycStatus: string | null | undefined,
): string {
  const s = (kycStatus ?? "none").toLowerCase();
  if (s === "approved") return t("profile_kyc_ok");
  if (s === "pending" || s === "manual_review") return t("profile_kyc_pending");
  if (s === "rejected") return t("profile_kyc_pending");
  return t("profile_kyc_badge_off");
}
