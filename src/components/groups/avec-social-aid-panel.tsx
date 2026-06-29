"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecIconSolidarity } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";

type AidRequest = {
  id: string;
  requesterUserId: string;
  requesterDisplay: string;
  aidType: string;
  aidMode: string;
  amountUsdt: number;
  status: string;
  proposalId: string | null;
  justification: string;
  createdAt: string;
};

type AidState = {
  socialBalanceUsdt: number;
  limits: {
    committeeMaxUsdt: number;
    memberCapUsdt: number;
    groupMonthCapUsdt: number;
    minDaysBetween: number;
  };
  requests: AidRequest[];
};

const AID_TYPES = [
  "illness",
  "death",
  "emergency",
  "disaster",
  "maternity",
  "accident",
] as const;

export function AvecSocialAidPanel({
  groupId,
  myUserId,
  canRequest,
  onDone,
}: {
  groupId: string;
  myUserId?: string;
  canRequest: boolean;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<AidState | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [aidType, setAidType] = useState<string>("emergency");
  const [aidMode, setAidMode] = useState<string>("grant");
  const [amount, setAmount] = useState("");
  const [justification, setJustification] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/social-aid`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setData(j as AidState);
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/social-aid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aidType,
          aidMode,
          amountUsdt: n,
          justification: justification.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("avec_social_aid_submitted"));
      setAmount("");
      setJustification("");
      await load();
      onDone();
    } finally {
      setBusy(false);
    }
  }

  const limits = data?.limits;
  const committeeMax = limits?.committeeMaxUsdt ?? 50;

  return (
    <div className={avecCls.section}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
          <AvecIconSolidarity className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={avecCls.sectionTitle}>{t("avec_social_aid_title")}</p>
          <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
            {t("avec_social_aid_hint")}
          </p>
          {data ? (
            <p className="mt-2 text-lg font-black tabular-nums text-amber-900">
              {data.socialBalanceUsdt.toFixed(2)}{" "}
              <span className="text-xs font-bold">USDT</span>
              <span className="ml-1 text-[10px] font-semibold text-[color:var(--fd-muted)]">
                {t("avec_fund_social")}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {canRequest ? (
        <div className="mt-3 space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3">
          <p className="text-[10px] font-bold text-amber-900">{t("avec_social_aid_form_title")}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
                {t("avec_social_aid_type")}
              </span>
              <select
                value={aidType}
                onChange={(e) => setAidType(e.target.value)}
                className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
              >
                {AID_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {t(`avec_social_aid_type_${x}` as keyof typeof t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
                {t("avec_social_aid_mode")}
              </span>
              <select
                value={aidMode}
                onChange={(e) => setAidMode(e.target.value)}
                className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
              >
                <option value="grant">{t("avec_social_aid_mode_grant")}</option>
                <option value="repayable">{t("avec_social_aid_mode_repayable")}</option>
                <option value="partial">{t("avec_social_aid_mode_partial")}</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("avec_social_aid_amount")}
            </span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
            />
          </label>
          <p className="text-[9px] text-amber-800">
            {t("avec_social_aid_vote_tier_hint", { max: committeeMax.toFixed(0) })}
          </p>
          <label className="block">
            <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("avec_social_aid_justification")}
            </span>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              className={`${avecCls.input} mt-0.5 w-full resize-none text-xs`}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className={avecCls.btnPrimary}
          >
            {t("avec_social_aid_submit")}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[color:var(--fd-muted)]">{t("avec_social_aid_members_only")}</p>
      )}

      {data && data.requests.length > 0 ? (
        <ul className="mt-3 max-h-[40vh] space-y-2 overflow-y-auto">
          {data.requests.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-bold">{r.requesterDisplay}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    r.status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.status === "pending_vote"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {t(`avec_social_aid_status_${r.status}` as keyof typeof t)}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-black tabular-nums text-amber-900">
                {r.amountUsdt.toFixed(2)} USDT · {t(`avec_social_aid_type_${r.aidType}` as keyof typeof t)}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[10px] text-[color:var(--fd-muted)]">
                {r.justification}
              </p>
              {r.status === "pending_vote" && r.proposalId && r.requesterUserId !== myUserId ? (
                <p className="mt-1 text-[9px] font-semibold text-violet-800">
                  {t("group_gov_vote_in_dialogue")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-[color:var(--fd-muted)]">-</p>
      )}

      {info ? <p className="mt-2 text-xs font-semibold text-emerald-800">{info}</p> : null}
      {err ? (
        <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}
