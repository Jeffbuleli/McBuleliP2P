"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/locale";
import { useI18n } from "@/components/i18n-provider";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import { P2pStatusIcon, p2pStatusLabelKey } from "@/components/p2p/p2p-status-badge";
import type { P2pActivityItem } from "@/lib/p2p-activity";

function fmtAmt(raw: string, locale: Locale) {
  const x = Number(raw);
  if (!Number.isFinite(x)) return raw;
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return x.toLocaleString(loc, { maximumFractionDigits: 4 });
}

export function P2PRecentActivity({ items }: { items: P2pActivityItem[] }) {
  const { t, locale } = useI18n();
  const rows = items.slice(0, 3);

  return (
    <HudFrame accent="magenta" className={`${HUD_PANEL_LG} p-4`}>
      <section aria-label={t("p2p_recent_activity")}>
        <h2 className="fd-section-title mb-3 text-fuchsia-200">{t("p2p_recent_activity")}</h2>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">
            {t("p2p_recent_empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/app/p2p/order/${row.id}`}
                  className="flex min-h-[52px] items-center gap-3 rounded-xl border border-white/10 bg-[#0a1018]/85 px-3 py-2.5 transition active:scale-[0.99] hover:border-fuchsia-400/25"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-300">
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
                    <p className="mt-0.5 truncate text-[11px] font-medium text-cyan-400/90">
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
          className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/10 py-3 text-center text-sm font-semibold text-fuchsia-300 transition active:scale-[0.99] hover:bg-fuchsia-500/18"
        >
          {t("p2p_see_all_orders")}
        </Link>
      </section>
    </HudFrame>
  );
}
