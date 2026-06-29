import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";

export type ActivityRow = {
  id: string;
  kind: "deposit" | "withdrawal";
  /** e.g. USDT, PI */
  asset: string;
  /** Localized network description */
  networkLabel: string;
  amount: string | null;
  status: string;
  tone: "success" | "pending" | "failed";
};

export function RecentActivity({
  locale,
  items,
}: {
  locale: Locale;
  items: ActivityRow[];
}) {
  const d = getDictionary(locale);

  return (
    <HudFrame accent="green" className={`${HUD_PANEL_LG} p-4`}>
      <section aria-label={d.recent_activity}>
        <h2 className="mb-3 fd-section-title text-emerald-200">{d.recent_activity}</h2>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">
            {d.recent_empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((row) => (
              <li
                key={`${row.kind}-${row.id}`}
                className="flex min-h-[52px] items-center gap-3 rounded-xl border border-white/10 bg-[#0a1018]/85 px-3 py-2.5"
              >
                <span
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    row.kind === "deposit"
                      ? "border border-emerald-400/30 bg-emerald-500/12 text-emerald-300"
                      : "border border-rose-400/30 bg-rose-500/12 text-rose-300"
                  }`}
                >
                  {row.kind === "deposit" ? <InIcon /> : <OutIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--fd-text)]">
                    {row.kind === "deposit" ? d.deposit : d.withdraw}
                  </p>
                  <p className="truncate text-[11px] text-[color:var(--fd-muted)]">
                    {row.networkLabel}
                  </p>
                  <p className="text-xs">
                    <StatusBadge locale={locale} tone={row.tone} raw={row.status} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-[color:var(--fd-text)]">
                    {row.amount != null ? `${row.amount}` : "-"}{" "}
                    <span className="text-xs font-medium text-[color:var(--fd-muted)]">
                      {activityAssetUnit(row.asset)}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/app/wallet/history"
          className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/12 py-3 text-center text-sm font-semibold text-emerald-300 transition active:scale-[0.99] hover:bg-emerald-500/20"
        >
          {d.wallet_see_all}
        </Link>
      </section>
    </HudFrame>
  );
}

function activityAssetUnit(asset: string): string {
  const u = asset.trim().toUpperCase();
  if (u === "PI") return "PI";
  return "USDT";
}

function StatusBadge({
  locale,
  tone,
  raw,
}: {
  locale: Locale;
  tone: ActivityRow["tone"];
  raw: string;
}) {
  const d = getDictionary(locale);
  const label =
    tone === "success"
      ? d.status_ui_success
      : tone === "pending"
        ? d.status_ui_pending
        : d.status_ui_failed;
  const cls =
    tone === "success"
      ? "text-emerald-400"
      : tone === "pending"
        ? "text-amber-400"
        : "text-rose-400";
  return (
    <span className={cls}>
      {label} · {raw}
    </span>
  );
}

function InIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12m0 0l4-4m-4 4l-4-4M4 20h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20V8m0 0l4 4m-4-4l-4 4M4 4h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
