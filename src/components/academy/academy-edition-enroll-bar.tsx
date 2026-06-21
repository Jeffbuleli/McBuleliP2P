"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { formatAcademyUsdtPrice } from "@/lib/academy-format";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

export function AcademyEditionEnrollBar({
  editionSlug,
  programSlug,
  title,
  priceUsdt,
  requiresKyc,
  onEnrolled,
}: {
  editionSlug: string;
  programSlug: string;
  title: string;
  priceUsdt: string | null;
  requiresKyc: boolean;
  onEnrolled: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const price = priceUsdt ? Number(priceUsdt) : 0;

  async function enroll() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/enroll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ editionSlug, programSlug }),
        },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof j.error === "string" ? j.error : "";
        if (code === "academy_insufficient_balance") {
          setErr(t("academy_insufficient_balance"));
        } else if (code === "academy_kyc_required") {
          setErr(t("academy_kyc_required"));
        } else {
          setErr(t("academy_error_enroll"));
        }
        return;
      }
      onEnrolled();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-[#305f33] bg-[#e8f3ee] p-4">
      <div className="flex items-center gap-3">
        <img src="/academy/event-live.svg" alt="" className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-[#305f33]">{title}</p>
          <p className="text-[10px] text-[#1a2e1c]">
            {price > 0
              ? `${formatAcademyUsdtPrice(priceUsdt)} USDT`
              : t("academy_enroll")}
            {requiresKyc ? ` · ${t("academy_pro_kyc_hint")}` : ""}
          </p>
        </div>
      </div>
      {err ? (
        <p className="mt-2 text-xs font-semibold text-rose-700">{err}</p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void enroll()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#305f33] py-3 text-sm font-extrabold text-white disabled:opacity-60"
      >
        <AcademyIcon name="calendar" className="h-4 w-4 !text-white" />
        {busy ? "…" : t("academy_enroll")}
      </button>
    </section>
  );
}
