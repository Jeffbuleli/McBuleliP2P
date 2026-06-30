import Link from "next/link";
import type { ServicePromoDTO, StakingPromoDTO } from "@/components/mobile/wallet-overview";
import { AvecCompactIllustration } from "@/components/wallet/avec-illustrations";
import { BuleliPointsCompactIllustration } from "@/components/wallet/points-illustrations";
import { StakingHeroIllustration } from "@/components/wallet/staking-illustrations";
import { WalletIconPool } from "@/components/wallet/wallet-service-icons";

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

function StakingPromoCard({ promo }: { promo: StakingPromoDTO }) {
  return (
    <Link
      href={promo.href}
      className="fd-card flex items-center gap-2 overflow-hidden px-2.5 py-2.5 active:scale-[0.99] sm:gap-3 sm:px-3"
    >
      <StakingHeroIllustration className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
      <div className="min-w-0 shrink-0">
        <p className="text-sm font-bold leading-tight text-[color:var(--fd-text)]">
          {promo.title}
        </p>
        <p className="truncate text-[10px] text-[color:var(--fd-muted)]">
          {promo.activeLine}
        </p>
      </div>
      <div className="ml-auto flex min-w-0 flex-1 items-stretch justify-end gap-0 divide-x divide-[color:var(--fd-border)] overflow-hidden rounded-lg border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/25">
        <div className="min-w-0 flex-1 px-2 py-1.5 text-center sm:px-2.5">
          <p className="truncate text-[8px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)] sm:text-[9px]">
            {promo.lockedLabel}
          </p>
          <p className="truncate text-[11px] font-bold tabular-nums text-[color:var(--fd-primary)] sm:text-xs">
            {promo.lockedDisplay}
          </p>
        </div>
        <div className="min-w-0 flex-1 px-2 py-1.5 text-center sm:px-2.5">
          <p className="truncate text-[8px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)] sm:text-[9px]">
            {promo.accruedLabel}
          </p>
          <p className="truncate text-[11px] font-bold tabular-nums text-[color:var(--fd-text)] sm:text-xs">
            {promo.accruedDisplay}
          </p>
        </div>
      </div>
      <Chevron />
    </Link>
  );
}

function CompactPromoCard({ promo }: { promo: ServicePromoDTO }) {
  return (
    <Link
      href={promo.href}
      className="fd-card flex items-center gap-2.5 p-3 active:scale-[0.99]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-emerald-100 text-cyan-900 ring-1 ring-white/80"
        aria-hidden
      >
        <WalletIconPool />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[color:var(--fd-text)]">{promo.title}</p>
        <p className="mt-0.5 truncate text-[10px] text-[color:var(--fd-muted)]">
          {promo.metaLine}
        </p>
      </div>
      <Chevron />
    </Link>
  );
}

function AvecPromoCard({
  promo,
}: {
  promo: ServicePromoDTO & { rightPrimary: string; rightSecondary?: string };
}) {
  return (
    <Link
      href={promo.href}
      className="fd-card flex items-center gap-3 p-3.5 active:scale-[0.99]"
    >
      <AvecCompactIllustration className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{promo.title}</p>
          {Number(promo.rightPrimary) > 0 ? (
            <span className="rounded-full bg-[color:var(--fd-primary)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
              {promo.rightPrimary}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">{promo.metaLine}</p>
        {promo.rightSecondary ? (
          <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]/80">
            {promo.rightSecondary}
          </p>
        ) : null}
      </div>
      <Chevron />
    </Link>
  );
}

function PointsPromoCard({
  balance,
  teaser,
  title,
}: {
  balance: number;
  teaser: string;
  title: string;
}) {
  return (
    <Link
      href="/app/wallet/points"
      className="fd-card flex items-center gap-3 p-3.5 active:scale-[0.99]"
    >
      <BuleliPointsCompactIllustration className="h-12 w-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{title}</p>
          {balance > 0 ? (
            <span className="rounded-full bg-[color:var(--fd-primary)] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
              {balance}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">{teaser}</p>
      </div>
      <Chevron />
    </Link>
  );
}

/** Staking + pool on one row; AVEC full-width below. */
export function WalletServicePromos({
  stakingPromo,
  poolPromo,
  avecPromo,
  pointsPromo,
}: {
  stakingPromo: StakingPromoDTO | null;
  poolPromo: ServicePromoDTO | null;
  avecPromo: (ServicePromoDTO & { rightPrimary: string; rightSecondary?: string }) | null;
  pointsPromo?: { balance: number; title: string; teaser: string } | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      {pointsPromo ? (
        <PointsPromoCard
          balance={pointsPromo.balance}
          title={pointsPromo.title}
          teaser={pointsPromo.teaser}
        />
      ) : null}
      {stakingPromo ? <StakingPromoCard promo={stakingPromo} /> : null}
      {poolPromo ? (
        <div className={stakingPromo ? "" : "grid grid-cols-2 gap-2"}>
          <CompactPromoCard promo={poolPromo} />
        </div>
      ) : null}

      {avecPromo ? <AvecPromoCard promo={avecPromo} /> : null}
    </div>
  );
}
