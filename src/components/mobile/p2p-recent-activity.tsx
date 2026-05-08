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
    <section className="rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <h2 className="mb-3 text-sm font-bold text-stone-50">{t("p2p_recent_activity")}</h2>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-400">{t("p2p_recent_empty")}</p>
      ) : (
        <ul className="flex flex-col gap-0">
          {items.map((row) => (
            <li
              key={row.id}
              className="border-b border-stone-800/80 py-3 last:border-0"
            >
              <Link
                href={`/app/p2p/order/${row.id}`}
                className="flex min-h-[52px] items-center gap-3 transition active:opacity-90"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-900/70 text-emerald-200 ring-1 ring-emerald-700/35">
                  <P2pStatusIcon status={row.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-50">
                    {fmtAmt(row.fiatAmount, locale)} {row.fiatCurrency}
                  </p>
                  <p className="truncate text-[11px] text-stone-400">
                    {fmtAmt(row.cryptoAmount, locale)} {row.asset} ·{" "}
                    {row.role === "maker"
                      ? t("p2p_home_role_maker")
                      : t("p2p_home_role_taker")}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-stone-300">
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
        className="mt-3 block min-h-[44px] rounded-xl border border-emerald-700/30 bg-emerald-950/30 py-3 text-center text-sm font-semibold text-emerald-200 transition hover:bg-emerald-950/45 active:scale-[0.99]"
      >
        {t("p2p_see_all_orders")}
      </Link>
    </section>
  );
}
