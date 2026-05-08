import Link from "next/link";
import type { ServicePromoDTO, StakingPromoDTO } from "@/components/mobile/wallet-overview";

/** Staking + pool / groups / loans tiles — kept below balances & Pi pay on the Wallet page. */
export function WalletServicePromos({
  stakingPromo,
  servicePromos,
}: {
  stakingPromo: StakingPromoDTO | null;
  servicePromos?: ServicePromoDTO[] | null;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 pb-6">
      {stakingPromo ? (
        <Link
          href={stakingPromo.href}
          className="block rounded-2xl border border-emerald-800/20 bg-gradient-to-br from-emerald-50/95 to-amber-50/40 p-4 shadow-sm ring-1 ring-emerald-900/10 transition active:scale-[0.99] dark:border-emerald-700/30 dark:from-emerald-950/50 dark:to-stone-900/80 dark:ring-emerald-500/10"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                {stakingPromo.title}
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-[color:var(--mb-text)] dark:text-stone-100">
                {stakingPromo.tagline}
              </p>
              <p className="mt-1.5 text-[11px] leading-snug text-[color:var(--mb-muted)] dark:text-stone-400">
                {stakingPromo.riskShort}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white dark:bg-emerald-600">
              {stakingPromo.cta}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-900/10 pt-3 dark:border-emerald-800/30">
            <div>
              <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                {stakingPromo.lockedLabel}
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
                {stakingPromo.lockedDisplay}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-stone-500 dark:text-stone-400">
                {stakingPromo.accruedLabel}
              </p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
                {stakingPromo.accruedDisplay}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] font-medium text-stone-600 dark:text-stone-400">
            {stakingPromo.activeLine}
          </p>
        </Link>
      ) : null}

      {servicePromos && servicePromos.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {servicePromos.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`block rounded-2xl border p-3.5 shadow-sm ring-1 transition active:scale-[0.99] ${
                p.tone === "emerald"
                  ? "border-emerald-800/20 bg-gradient-to-br from-emerald-50/95 to-white ring-emerald-900/10 dark:border-emerald-700/30 dark:from-emerald-950/40 dark:to-stone-900/80 dark:ring-emerald-500/10"
                  : "border-amber-800/20 bg-gradient-to-br from-amber-50/95 to-white ring-amber-900/10 dark:border-amber-700/30 dark:from-amber-950/25 dark:to-stone-900/80 dark:ring-amber-500/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      p.tone === "emerald"
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    {p.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[color:var(--mb-text)] dark:text-stone-100">
                    {p.tagline}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[color:var(--mb-muted)] dark:text-stone-400">
                    {p.metaLine}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white ${
                    p.tone === "emerald"
                      ? "bg-emerald-700 dark:bg-emerald-600"
                      : "bg-amber-700 dark:bg-amber-600"
                  }`}
                >
                  {p.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
