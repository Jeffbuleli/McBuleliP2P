"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/locale";
import { useI18n } from "@/components/i18n-provider";
import { P2pStatusIcon, p2pStatusLabelKey } from "@/components/p2p/p2p-status-badge";
import type { P2pActivityItem } from "@/lib/p2p-activity";

function fmtAmt(raw: string, locale: Locale) {
  const x = Number(raw);
  if (!Number.isFinite(x)) return raw;
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return x.toLocaleString(loc, { maximumFractionDigits: 8 });
}

export function P2PRecentActivity({ items }: { items: P2pActivityItem[] }) {
  const { t, locale } = useI18n();

  return (
    <section className="fd-card p-4">
      <h2 className="fd-section-title mb-3">{t("p2p_recent_activity")}</h2>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">
          {t("p2p_recent_empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-0">
          {items.map((row) => (
            <li
              key={row.id}
              className="border-b border-[color:var(--fd-border)] py-3 last:border-0"
            >
              <Link
                href={`/app/p2p/order/${row.id}`}
                className="flex min-h-[52px] items-center gap-3 transition active:opacity-90"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-border)]">
                  <P2pStatusIcon status={row.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--fd-text)]">
                    {fmtAmt(row.fiatAmount, locale)} {row.fiatCurrency}
                  </p>
                  <p className="truncate text-[11px] text-[color:var(--fd-muted)]">
                    {fmtAmt(row.cryptoAmount, locale)} {row.asset} ·{" "}
                    {row.role === "maker"
                      ? t("p2p_home_role_maker")
                      : t("p2p_home_role_taker")}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[color:var(--fd-primary)]">
                    {t(p2pStatusLabelKey(row.status))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/app/p2p?tab=orders"
        className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] py-3 text-center text-sm font-semibold text-[color:var(--fd-primary)] transition active:scale-[0.99] hover:bg-[color:var(--fd-mint-deep)]"
      >
        {t("p2p_see_all_orders")}
      </Link>
    </section>
  );
}
