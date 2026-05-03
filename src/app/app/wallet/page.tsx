import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getPortfolioSnapshotForUser } from "@/lib/portfolio-display";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();
  const d = getDictionary(locale);

  if (!userId) {
    return null;
  }

  const snapshot = await getPortfolioSnapshotForUser(userId, locale);
  const s = snapshot ?? {
    totalEquivDisplay: "≈ 0 USDT",
    usdtDisplay: "0 USDT",
    piDisplay: "0 Pi",
    fiatUsdDisplay: "≈ 0 USD",
    fiatCdfDisplay: "≈ 0 CDF",
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
          {d.wallet_title}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          {d.wallet_balance_hint}
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-900/10 bg-gradient-to-b from-white to-emerald-50/80 p-5 shadow-md dark:border-white/10 dark:from-stone-900 dark:to-stone-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {d.balance_estimated_total}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
          {s.totalEquivDisplay}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-emerald-900/10 pt-3 text-sm dark:border-white/10">
          <div>
            <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
              USDT
            </p>
            <p className="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {s.usdtDisplay}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
              Pi
            </p>
            <p className="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {s.piDisplay}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
              USD
            </p>
            <p className="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {s.fiatUsdDisplay}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
              CDF
            </p>
            <p className="font-semibold tabular-nums text-stone-900 dark:text-stone-100">
              {s.fiatCdfDisplay}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/app/deposit"
          className="flex min-h-[52px] items-center justify-center rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white shadow-lg shadow-emerald-900/20 active:scale-[0.99]"
        >
          {d.deposit}
        </Link>
        <Link
          href="/app/withdraw"
          className="flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-rose-900/35 bg-white py-3.5 text-lg font-semibold text-rose-950 active:scale-[0.99] dark:bg-stone-900 dark:text-rose-100"
        >
          {d.withdraw}
        </Link>
      </div>
    </div>
  );
}
