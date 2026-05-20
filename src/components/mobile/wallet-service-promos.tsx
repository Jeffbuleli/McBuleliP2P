import Link from "next/link";
import type { ServicePromoDTO, StakingPromoDTO } from "@/components/mobile/wallet-overview";
import {
  WalletIconGroup,
  WalletIconLoans,
  WalletIconPool,
  WalletIconStaking,
} from "@/components/wallet/wallet-service-icons";

function PromoIcon({ icon }: { icon: ServicePromoDTO["icon"] | "staking" }) {
  const cls =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white/80";
  switch (icon) {
    case "staking":
      return (
        <span className={`${cls} bg-gradient-to-br from-emerald-200 to-amber-200 text-[color:var(--fd-primary)]`} aria-hidden>
          <WalletIconStaking />
        </span>
      );
    case "pool":
      return (
        <span className={`${cls} bg-gradient-to-br from-cyan-200 to-emerald-200 text-cyan-900`} aria-hidden>
          <WalletIconPool />
        </span>
      );
    case "likelimba":
      return (
        <span className={`${cls} bg-gradient-to-br from-emerald-200 to-teal-200 text-teal-900`} aria-hidden>
          <WalletIconGroup />
        </span>
      );
    case "avec":
      return (
        <span className={`${cls} bg-gradient-to-br from-amber-200 to-orange-200 text-orange-900`} aria-hidden>
          <WalletIconGroup />
        </span>
      );
    case "loans":
      return (
        <span className={`${cls} bg-gradient-to-br from-amber-100 to-stone-300 text-stone-800`} aria-hidden>
          <WalletIconLoans />
        </span>
      );
    default:
      return null;
  }
}

/** Staking + pool / groups / loans — icon-first tiles on Wallet. */
export function WalletServicePromos({
  stakingPromo,
  servicePromos,
}: {
  stakingPromo: StakingPromoDTO | null;
  servicePromos?: ServicePromoDTO[] | null;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 pb-6">
      {stakingPromo ? (
        <Link href={stakingPromo.href} className="fd-card block p-3.5 active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <PromoIcon icon="staking" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[color:var(--fd-text)]">
                {stakingPromo.title}
              </p>
              <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">
                {stakingPromo.activeLine}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold tabular-nums text-[color:var(--fd-primary)]">
                {stakingPromo.lockedDisplay}
              </p>
              <p className="text-[10px] text-[color:var(--fd-muted)]">
                +{stakingPromo.accruedDisplay}
              </p>
            </div>
            <Chevron />
          </div>
        </Link>
      ) : null}

      {servicePromos && servicePromos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {servicePromos.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="fd-card block p-3 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <PromoIcon icon={p.icon} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[color:var(--fd-text)]">{p.title}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[color:var(--fd-muted)]">
                    {p.metaLine}
                  </p>
                </div>
                <Chevron />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[color:var(--fd-muted)]"
      aria-hidden
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
