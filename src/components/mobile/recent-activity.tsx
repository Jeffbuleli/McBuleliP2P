import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

export type ActivityRow = {
  id: string;
  kind: "deposit" | "withdrawal";
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
    <section className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-stone-900">
      <h2 className="mb-3 text-sm font-bold text-stone-900 dark:text-stone-50">
        {d.recent_activity}
      </h2>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
          {d.recent_empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-0">
          {items.map((row) => (
            <li
              key={`${row.kind}-${row.id}`}
              className="flex min-h-[52px] items-center gap-3 border-b border-stone-100 py-3 last:border-0 dark:border-stone-800"
            >
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  row.kind === "deposit"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100"
                }`}
              >
                {row.kind === "deposit" ? <InIcon /> : <OutIcon />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {row.kind === "deposit" ? d.deposit : d.withdraw}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  <StatusBadge locale={locale} tone={row.tone} raw={row.status} />
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                  {row.amount != null ? `${row.amount}` : "—"}{" "}
                  <span className="text-xs font-medium text-stone-500">USDT</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/app/wallet"
        className="mt-3 block min-h-[44px] rounded-xl border border-emerald-700/20 py-3 text-center text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-300"
      >
        {d.wallet_see_all}
      </Link>
    </section>
  );
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
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "pending"
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";
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
