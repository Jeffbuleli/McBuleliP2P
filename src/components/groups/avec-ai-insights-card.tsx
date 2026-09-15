"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type Insight = {
  id: string;
  textEn: string;
  textFr: string;
  source: string;
  confidence: string;
};

type Snapshot = {
  totalSavingsUsdt: number;
  activeLoans: number;
  outstandingLoansUsdt: number;
  overdueLoans: number;
  memberCount: number;
  cycleNumber: number;
};

export function AvecAiInsightsCard({ groupId }: { groupId: string }) {
  const { t, locale } = useI18n();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [mode, setMode] = useState<string>("deterministic");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/insights?locale=${locale === "fr" ? "fr" : "en"}`,
        { cache: "no-store" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "failed");
        return;
      }
      setInsights((j as { insights?: Insight[] }).insights ?? []);
      setSnapshot((j as { snapshot?: Snapshot }).snapshot ?? null);
      setMode((j as { mode?: string }).mode ?? "deterministic");
    } catch {
      setErr("failed");
    }
  }, [groupId, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("avec_ai_insights_title")}
        </h3>
        <span className="rounded-md bg-[color:var(--fd-bg)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
          {mode === "llm_enriched" ? t("avec_ai_mode_llm") : t("avec_ai_mode_rules")}
        </span>
      </div>
      {snapshot ? (
        <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
          {t("avec_ai_snapshot_line")
            .replace("{savings}", snapshot.totalSavingsUsdt.toFixed(0))
            .replace("{members}", String(snapshot.memberCount))
            .replace("{cycle}", String(snapshot.cycleNumber))}
        </p>
      ) : null}
      {err ? (
        <p className="mt-2 text-xs text-rose-700">{t("avec_ai_insights_error")}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {insights.map((ins) => (
            <li
              key={ins.id}
              className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-2.5 py-2"
            >
              <p className="text-xs leading-relaxed text-[color:var(--fd-text)]">
                {locale === "fr" ? ins.textFr : ins.textEn}
              </p>
              <p className="mt-1 text-[9px] text-[color:var(--fd-muted)]">
                {t("avec_ai_source")}: {ins.source} · {ins.confidence}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[9px] leading-snug text-[color:var(--fd-muted)]">
        {t("avec_ai_disclaimer")}
      </p>
    </section>
  );
}
