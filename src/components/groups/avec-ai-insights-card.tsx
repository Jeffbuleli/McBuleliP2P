"use client";

import { AVEC_MONEY } from "@/lib/avec/display-currency";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

type Insight = {
  id: string;
  textEn: string;
  textFr: string;
};

type Snapshot = {
  totalSavingsUsdt: number;
  memberCount: number;
  cycleNumber: number;
  overdueLoans: number;
  activeLoans: number;
};

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l1.2 6.3L19 8l-4.5 3.5L16 18l-4-3-4 3 1.5-6.5L5 8l5.8-.7L12 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AvecAiInsightsCard({ groupId }: { groupId: string }) {
  const { t, locale } = useI18n();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setErr(false);
    try {
      const res = await fetch(`/api/groups/${groupId}/insights`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(true);
        return;
      }
      const list = ((j as { insights?: Insight[] }).insights ?? []).slice(0, 3);
      setInsights(list);
      setSnapshot((j as { snapshot?: Snapshot }).snapshot ?? null);
    } catch {
      setErr(true);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-3">
      <div className="flex items-center gap-2">
        <SparkIcon className="h-5 w-5 text-[color:var(--fd-primary)]" />
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("avec_ai_insights_title")}
        </h3>
      </div>

      {snapshot ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          <MiniStat label={AVEC_MONEY} value={snapshot.totalSavingsUsdt.toFixed(0)} />
          <MiniStat label={t("avec_vue_members")} value={String(snapshot.memberCount)} />
          <MiniStat
            label={t("avec_vue_cycle")}
            value={`#${snapshot.cycleNumber}`}
          />
        </div>
      ) : null}

      {err ? (
        <p className="mt-2 text-[10px] text-rose-700">{t("avec_ai_insights_error")}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {insights.map((ins) => {
            const raw = locale === "fr" ? ins.textFr : ins.textEn;
            const text = String(raw ?? "").trim().slice(0, 110);
            if (!text || text.startsWith("{") || text.startsWith("[")) return null;
            return (
              <li
                key={ins.id}
                className="flex gap-2 rounded-xl bg-[color:var(--fd-bg)] px-2.5 py-2 text-[11px] leading-snug text-[color:var(--fd-text)]"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--fd-primary)]" />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[color:var(--fd-bg)] px-1.5 py-1.5">
      <p className="text-sm font-black tabular-nums text-[color:var(--fd-text)]">{value}</p>
      <p className="truncate text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">{label}</p>
    </div>
  );
}
