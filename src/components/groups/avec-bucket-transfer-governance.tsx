"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";
import type { FundBucket } from "@/lib/avec/fund-buckets";

const FROM_OPTIONS: FundBucket[] = ["penalties", "interest"];
const TO_OPTIONS: FundBucket[] = ["social", "reserve", "savings"];

export function AvecBucketTransferGovernance({
  groupId,
  penaltiesUsdt,
  interestUsdt,
  canPropose,
  onDone,
}: {
  groupId: string;
  penaltiesUsdt: number;
  interestUsdt: number;
  canPropose: boolean;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [fromBucket, setFromBucket] = useState<FundBucket>("penalties");
  const [toBucket, setToBucket] = useState<FundBucket>("social");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const maxAvail =
    fromBucket === "penalties" ? penaltiesUsdt : interestUsdt;

  function bucketLabel(b: FundBucket): string {
    if (b === "penalties") return t("avec_fund_penalties");
    if (b === "interest") return t("avec_fund_interest");
    if (b === "social") return t("avec_fund_social");
    if (b === "reserve") return t("avec_fund_reserve");
    return t("avec_fund_savings");
  }

  async function submit() {
    const amountUsdt = Number(amount.replace(",", "."));
    if (!Number.isFinite(amountUsdt) || amountUsdt <= 0) return;
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer_fund_bucket",
          justification: t("group_gov_bucket_transfer_justification", {
            amount: amountUsdt.toFixed(2),
            from: bucketLabel(fromBucket),
            to: bucketLabel(toBucket),
          }),
          payload: { fromBucket, toBucket, amountUsdt },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_gov_proposal_submitted"));
      setAmount("");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  if (penaltiesUsdt < 0.01 && interestUsdt < 0.01) return null;

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3">
      <p className="text-[10px] font-bold text-amber-950">{t("avec_bucket_transfer_gov_title")}</p>
      <p className="mt-0.5 text-[9px] text-amber-900/90">{t("avec_bucket_transfer_gov_hint")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_bucket_transfer_from")}
          </span>
          <select
            value={fromBucket}
            onChange={(e) => setFromBucket(e.target.value as FundBucket)}
            disabled={!canPropose || busy}
            className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
          >
            {FROM_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {bucketLabel(b)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_bucket_transfer_to")}
          </span>
          <select
            value={toBucket}
            onChange={(e) => setToBucket(e.target.value as FundBucket)}
            disabled={!canPropose || busy}
            className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
          >
            {TO_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {bucketLabel(b)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-2 block">
        <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
          {t("avec_bucket_transfer_amount")}
        </span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder={maxAvail > 0 ? maxAvail.toFixed(2) : "0"}
          disabled={!canPropose || busy}
          className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
        />
        <p className="mt-0.5 text-[9px] text-[color:var(--fd-muted)]">
          {t("avec_bucket_transfer_max", { amount: maxAvail.toFixed(2) })}
        </p>
      </label>
      {canPropose ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="mt-2 rounded-full bg-amber-800 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
        >
          {t("avec_bucket_transfer_submit")}
        </button>
      ) : null}
      {info ? <p className="mt-2 text-[10px] text-emerald-800">{info}</p> : null}
      {err ? (
        <p className="mt-2 text-[10px] text-rose-800">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}
