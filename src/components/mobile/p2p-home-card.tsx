"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import {
  p2pStatusBadgeClasses,
  p2pStatusLabelKey,
} from "@/components/p2p/p2p-status-badge";
import type { P2pActivityItem } from "@/lib/p2p-activity";
import { interpolate } from "@/i18n/messages";
import { IconP2P } from "@/components/icons/flow-icons";

const INNER_TILE =
  "rounded-xl border border-white/10 bg-[#0a1018]/85 transition active:scale-[0.99] hover:border-amber-400/25";

function fmtAmt(raw: string, locale: "en" | "fr") {
  const x = Number(raw);
  if (!Number.isFinite(x)) return raw;
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return x.toLocaleString(loc, { maximumFractionDigits: 4 });
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
    <HudFrame accent="amber" className={`${HUD_PANEL_LG} overflow-hidden p-4`}>
      <section aria-label={t("p2p_home_section_title")}>
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-sm"
            aria-hidden
          >
            <IconP2P className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="fd-section-title text-amber-200">{t("p2p_home_section_title")}</h2>
            <p className="mt-0.5 fd-section-muted line-clamp-2">{t("p2p_home_hint")}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/app/p2p"
            prefetch
            className="flex min-h-[48px] items-center justify-center rounded-2xl border border-amber-400/45 bg-amber-500/15 py-3 text-center text-sm font-bold text-amber-300 shadow-sm transition active:scale-[0.99] hover:bg-amber-500/25"
          >
            {t("p2p_home_cta_market")}
          </Link>
          <Link
            href="/app/p2p?tab=orders"
            prefetch
            className="flex min-h-[48px] items-center justify-center rounded-2xl border border-white/12 bg-[#0a1018]/80 py-3 text-center text-sm font-semibold text-[color:var(--fd-text)] transition active:scale-[0.99] hover:border-amber-400/25"
          >
            {t("p2p_home_cta_orders")}
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--fd-muted)]">
          <span className="tabular-nums text-amber-300/90">
            {interpolate(t("p2p_home_kpi_in_progress"), {
              count: inProgressCount,
            })}
          </span>
          {disputedCount > 0 ? (
            <span className="font-semibold text-rose-400 tabular-nums">
              {interpolate(t("p2p_home_kpi_disputes"), { count: disputedCount })}
            </span>
          ) : null}
        </div>

        {previews.length > 0 ? (
          <ul className="mt-3 space-y-2 border-t border-white/8 pt-3">
            {previews.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/app/p2p/order/${o.id}`}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 ${INNER_TILE}`}
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
    </HudFrame>
  );
}
