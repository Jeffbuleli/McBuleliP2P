import Image from "next/image";
import Link from "next/link";
import type { ServicePromoDTO, StakingPromoDTO } from "@/components/mobile/wallet-overview";
import {
  WalletIconAvec,
  WalletIconPool,
  WalletIconStaking,
} from "@/components/wallet/wallet-service-icons";

function PromoIcon({ icon }: { icon: ServicePromoDTO["icon"] | "staking" }) {
  const cls =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white/80";
  switch (icon) {
    case "staking":
      return (
        <span
          className={`${cls} bg-gradient-to-br from-emerald-200 to-amber-200 text-[color:var(--fd-primary)]`}
          aria-hidden
        >
          <WalletIconStaking />
        </span>
      );
    case "pool":
      return (
        <span
          className={`${cls} bg-gradient-to-br from-cyan-200 to-emerald-200 text-cyan-900`}
          aria-hidden
        >
          <WalletIconPool />
        </span>
      );
    case "avec":
      return (
        <span
          className={`${cls} bg-gradient-to-br from-amber-200 to-orange-200 text-orange-900`}
          aria-hidden
        >
          <WalletIconAvec />
        </span>
      );
    default:
      return null;
  }
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

function CompactPromoCard({ promo }: { promo: ServicePromoDTO }) {
  return (
    <Link href={promo.href} className="fd-card block overflow-hidden p-3 active:scale-[0.99]">
      {promo.imageSrc ? (
        <div className="relative -mx-3 -mt-3 mb-2 h-16 overflow-hidden">
          <Image
            src={promo.imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        </div>
      ) : null}
      <div className="flex items-center gap-2.5">
        <PromoIcon icon={promo.icon} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{promo.title}</p>
          <p className="mt-0.5 truncate text-[10px] text-[color:var(--fd-muted)]">{promo.metaLine}</p>
        </div>
        <Chevron />
      </div>
    </Link>
  );
}

function WidePromoCard({
  icon,
  href,
  title,
  subtitle,
  rightPrimary,
  rightSecondary,
  imageSrc,
}: {
  icon: "staking" | "avec";
  href: string;
  title: string;
  subtitle: string;
  rightPrimary: string;
  rightSecondary?: string;
  imageSrc?: string;
}) {
  return (
    <Link href={href} className="fd-card block overflow-hidden p-3.5 active:scale-[0.99]">
      {imageSrc ? (
        <div className="relative -mx-3.5 -mt-3.5 mb-2.5 h-20 overflow-hidden rounded-t-2xl">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <PromoIcon icon={icon} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{title}</p>
          <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">{subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-bold tabular-nums text-[color:var(--fd-primary)]">
            {rightPrimary}
          </p>
          {rightSecondary ? (
            <p className="text-[10px] text-[color:var(--fd-muted)]">{rightSecondary}</p>
          ) : null}
        </div>
        <Chevron />
      </div>
    </Link>
  );
}

/** Staking + pool on one row; AVEC full-width below (staking-style banner). */
export function WalletServicePromos({
  stakingPromo,
  poolPromo,
  avecPromo,
}: {
  stakingPromo: StakingPromoDTO | null;
  poolPromo: ServicePromoDTO | null;
  avecPromo: (ServicePromoDTO & { rightPrimary: string; rightSecondary?: string }) | null;
}) {
  const showTopRow = stakingPromo || poolPromo;

  return (
    <div className="mt-4 flex flex-col gap-2 pb-6">
      {showTopRow ? (
        <div className="grid grid-cols-2 gap-2">
          {stakingPromo ? (
            <CompactPromoCard
              promo={{
                href: stakingPromo.href,
                title: stakingPromo.title,
                tagline: stakingPromo.tagline,
                cta: stakingPromo.cta,
                metaLine: `${stakingPromo.activeLine} · ${stakingPromo.lockedDisplay}`,
                tone: "emerald",
                icon: "staking",
              }}
            />
          ) : null}
          {poolPromo ? <CompactPromoCard promo={poolPromo} /> : null}
        </div>
      ) : null}

      {avecPromo ? (
        <WidePromoCard
          icon="avec"
          href={avecPromo.href}
          title={avecPromo.title}
          subtitle={avecPromo.metaLine}
          rightPrimary={avecPromo.rightPrimary}
          rightSecondary={avecPromo.rightSecondary}
          imageSrc={avecPromo.imageSrc}
        />
      ) : null}
    </div>
  );
}
