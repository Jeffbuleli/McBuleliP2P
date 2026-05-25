"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { ListPagination, useListPagination } from "@/components/ui/list-pagination";
import { AvecIconShares, AvecIconSolidarity } from "@/components/groups/avec-icons";
import { IlluMeeting } from "@/components/groups/avec-illustrations";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";
import {
  isSocialFundPerMeetingMisconfigured,
  maxSocialFundPerMeeting,
} from "@/lib/avec/social-fund-limits";

export function AvecMeetingPanel({
  groupId,
  shareValue,
  socialFundPerMeeting = 0,
  maxShares,
  canContribute,
  canFixSocial,
  busy,
  onPay,
  onSocialFixed,
  paySuccess = false,
}: {
  groupId?: string;
  shareValue: number;
  socialFundPerMeeting?: number;
  maxShares: number;
  canContribute: boolean;
  canFixSocial?: boolean;
  busy: boolean;
  onPay: (shares: number) => Promise<boolean>;
  onSocialFixed?: () => void;
  paySuccess?: boolean;
}) {
  const { t, locale } = useI18n();
  const [shares, setShares] = useState(1);
  const [justPaid, setJustPaid] = useState(false);
  const [fixSocial, setFixSocial] = useState("");
  const [fixBusy, setFixBusy] = useState(false);
  const [fixErr, setFixErr] = useState<string | null>(null);

  const sharesTotal = shareValue * shares;
  const meetingTotal = sharesTotal + socialFundPerMeeting;
  const socialMax = maxSocialFundPerMeeting(shareValue, maxShares);
  const misconfigured = isSocialFundPerMeetingMisconfigured(
    socialFundPerMeeting,
    shareValue,
    maxShares,
  );

  async function pay() {
    setJustPaid(false);
    const ok = await onPay(shares);
    if (ok) setJustPaid(true);
  }

  async function saveSocialFix() {
    if (!groupId) return;
    const n = Number(fixSocial.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return;
    setFixBusy(true);
    setFixErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "change_social_fund",
          justification: t("group_gov_social_fund_justification", {
            amount: n.toFixed(2),
          }),
          payload: { socialFundUsdt: n },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFixErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      onSocialFixed?.();
    } finally {
      setFixBusy(false);
    }
  }

  const showPaid = paySuccess || justPaid;

  type ContribRow = {
    id: string;
    batchId: string;
    entryType: string;
    amount: string;
    shares: number | null;
    createdAt: string;
  };
  const [history, setHistory] = useState<ContribRow[] | null>(null);

  useEffect(() => {
    if (!groupId) return;
    void fetch(`/api/groups/${groupId}/contributions`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.contributions) setHistory(j.contributions as ContribRow[]);
        else setHistory([]);
      })
      .catch(() => setHistory([]));
  }, [groupId, showPaid]);

  const batches = useMemo(() => {
    if (!history?.length) return [];
    const byBatch = new Map<
      string,
      { batchId: string; total: number; shares: number | null; createdAt: string }
    >();
    for (const row of history) {
      const amt = Number(row.amount) || 0;
      const prev = byBatch.get(row.batchId);
      if (!prev) {
        byBatch.set(row.batchId, {
          batchId: row.batchId,
          total: amt,
          shares: row.shares,
          createdAt: row.createdAt,
        });
      } else {
        prev.total += amt;
        if (row.shares != null) prev.shares = row.shares;
      }
    }
    return [...byBatch.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [history]);

  const histPag = useListPagination(batches, 10);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="space-y-3">
      <div className={`${avecCls.section} relative overflow-hidden`}>
        <span className="absolute -right-1 top-0 text-[color:var(--fd-primary)] opacity-[0.14]">
          <IlluMeeting className="h-20 w-24" />
        </span>
        <div className="relative flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
            <AvecIconShares className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("avec_tab_meeting")}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-[color:var(--fd-muted)]">
              {t("avec_meeting_hint_short")}
            </p>
          </div>
        </div>
      </div>

      {misconfigured ? (
        <div
          className="rounded-2xl border-2 border-rose-200 bg-rose-50/90 px-3 py-2.5"
          role="alert"
        >
          <p className="text-xs font-bold text-rose-900">{t("avec_social_misconfigured_title")}</p>
          <p className="mt-1 text-[10px] text-rose-800">
            {t("avec_social_misconfigured_body", {
              current: socialFundPerMeeting.toFixed(2),
              max: socialMax.toFixed(2),
            })}
          </p>
          {canFixSocial && groupId ? (
            <div className="mt-2 flex gap-2">
              <input
                value={fixSocial}
                onChange={(e) => setFixSocial(e.target.value)}
                inputMode="decimal"
                placeholder={`0 – ${socialMax.toFixed(0)}`}
                className={`${avecCls.input} !py-1.5 flex-1 text-xs`}
              />
              <button
                type="button"
                disabled={fixBusy}
                onClick={() => void saveSocialFix()}
                className="shrink-0 rounded-xl bg-rose-800 px-3 py-1.5 text-[10px] font-bold text-white"
              >
                {t("avec_social_fix_btn")}
              </button>
            </div>
          ) : null}
          {fixErr ? (
            <p className="mt-1 text-[10px] text-rose-700">{clientErrorText(t, fixErr)}</p>
          ) : null}
        </div>
      ) : null}

      <div className={avecCls.section}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("avec_buy_shares")} · {shareValue.toFixed(2)} USDT
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {Array.from({ length: maxShares }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setShares(n)}
              className={`${avecCls.shareChip} ${shares === n ? avecCls.shareChipOn : avecCls.shareChipOff}`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fd-mint)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--fd-primary)]">
            <AvecIconShares className="h-3.5 w-3.5" />
            {shares}× {sharesTotal.toFixed(2)}
          </span>
          {socialFundPerMeeting > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">
              <AvecIconSolidarity className="h-3.5 w-3.5" />
              +{socialFundPerMeeting.toFixed(2)}
            </span>
          ) : null}
          <span className="text-[10px] font-bold text-[color:var(--fd-muted)]">=</span>
          <span className="rounded-full bg-[color:var(--fd-primary)] px-3 py-1 text-sm font-black tabular-nums text-white">
            {meetingTotal.toFixed(2)} USDT
          </span>
        </div>

        <button
          type="button"
          disabled={busy || !canContribute || misconfigured}
          onClick={() => void pay()}
          className={`${avecCls.btnPrimary} mt-4`}
        >
          {t("group_dash_contribute")}
        </button>
        <p className="mt-2 text-center text-[10px] text-[color:var(--fd-muted)]">
          {t("avec_wallet_debit")}
        </p>
        {showPaid ? (
          <p
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-900"
            role="status"
          >
            <span aria-hidden>✓</span>
            {t("group_contribution_success")}
          </p>
        ) : null}
      </div>

      <div className={avecCls.section}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("avec_meeting_history_title")}
        </p>
        {history === null ? (
          <p className="mt-2 text-xs text-[color:var(--fd-muted)]">…</p>
        ) : batches.length === 0 ? (
          <p className="mt-2 text-xs text-[color:var(--fd-muted)]">{t("avec_meeting_history_empty")}</p>
        ) : (
          <>
            <ul className="mt-2 space-y-1.5">
              {histPag.slice.map((row) => (
                <li
                  key={row.batchId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--fd-border)] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] text-[color:var(--fd-muted)]">
                      {new Date(row.createdAt).toLocaleString(loc, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    {row.shares != null ? (
                      <p className="text-[10px] font-semibold text-[color:var(--fd-text)]">
                        {t("avec_meeting_history_shares", { count: row.shares })}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-mono text-xs font-bold tabular-nums text-[color:var(--fd-primary)]">
                    {row.total.toFixed(2)} USDT
                  </p>
                </li>
              ))}
            </ul>
            <ListPagination
              page={histPag.page}
              pageSize={histPag.pageSize}
              totalPages={histPag.totalPages}
              total={histPag.total}
              onPageChange={histPag.setPage}
              onPageSizeChange={histPag.setPageSize}
            />
          </>
        )}
      </div>
    </div>
  );
}
