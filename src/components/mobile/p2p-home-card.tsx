"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  p2pStatusBadgeClasses,
  p2pStatusLabelKey,
} from "@/components/p2p/p2p-status-badge";
import type { P2pActivityItem } from "@/lib/p2p-activity";
import { interpolate } from "@/i18n/messages";

function fmtAmt(raw: string, locale: "en" | "fr") {
  const x = Number(raw);
  if (!Number.isFinite(x)) return raw;
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return x.toLocaleString(loc, { maximumFractionDigits: 8 });
}

export function P2PHomeCard({
  inProgressCount,
  disputedCount,
  previewOrders,
}: {
  inProgressCount: number;
  disputedCount: number;
  previewOrders: P2pActivityItem[];
}) {
  const { t, locale } = useI18n();
  const lang = locale === "fr" ? "fr" : "en";
  const previews = previewOrders.slice(0, 3);

  return (
    <section
      className="fd-card overflow-hidden border-[color:var(--fd-primary)]/20 bg-gradient-to-b from-[color:var(--fd-mint)] to-[color:var(--fd-card)] p-4"
      aria-label={t("p2p_home_section_title")}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] text-lg text-white shadow-sm"
          aria-hidden
        >
          ⇄
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="fd-section-title">{t("p2p_home_section_title")}</h2>
          <p className="mt-0.5 fd-section-muted line-clamp-2">{t("p2p_home_hint")}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href="/app/p2p"
          prefetch
          className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] py-3 text-center text-sm font-bold text-white shadow-md transition active:scale-[0.99] hover:opacity-95"
        >
          {t("p2p_home_cta_market")}
        </Link>
        <Link
          href="/app/p2p?tab=orders"
          prefetch
          className="flex min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] py-3 text-center text-sm font-semibold text-[color:var(--fd-text)] transition active:scale-[0.99] hover:bg-[color:var(--fd-mint)]"
        >
          {t("p2p_home_cta_orders")}
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--fd-muted)]">
        <span className="tabular-nums">
          {interpolate(t("p2p_home_kpi_in_progress"), {
            count: inProgressCount,
          })}
        </span>
        {disputedCount > 0 ? (
          <span className="font-semibold text-rose-600 tabular-nums">
            {interpolate(t("p2p_home_kpi_disputes"), { count: disputedCount })}
          </span>
        ) : null}
      </div>

      {previews.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-[color:var(--fd-border)] pt-3">
          {previews.map((o) => (
            <li key={o.id}>
              <Link
                href={`/app/p2p/order/${o.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 transition active:scale-[0.99] hover:bg-[color:var(--fd-mint)]/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[color:var(--fd-text)]">
                    {fmtAmt(o.fiatAmount, lang)} {o.fiatCurrency}
                  </p>
                  <p className="truncate text-[10px] text-[color:var(--fd-muted)]">
                    {fmtAmt(o.cryptoAmount, lang)} {o.asset} ·{" "}
                    {o.role === "maker" ? t("p2p_home_role_maker") : t("p2p_home_role_taker")}
                  </p>
                </div>
                <span
                  className={`max-w-[10rem] shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${p2pStatusBadgeClasses(o.status)}`}
                >
                  {t(p2pStatusLabelKey(o.status))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
