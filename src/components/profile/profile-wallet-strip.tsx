import Link from "next/link";
import { ProfileIconChevronRight, ProfileIconWallet } from "@/components/icons/profile-icons";
import { profileChipClass } from "@/components/profile/profile-vibrant-styles";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";
import type { PortfolioSnapshot } from "@/lib/portfolio-display";

export function ProfileWalletStrip({
  portfolio,
  locale,
}: {
  portfolio: PortfolioSnapshot | null;
  locale: Locale;
}) {
  const d = getDictionary(locale);
  const total = portfolio?.totalEquivDisplay ?? "—";

  return (
    <Link href="/app/wallet" className="fd-card flex items-center gap-3.5 p-4 active:scale-[0.99]">
      <span className={`${profileChipClass.mint} flex h-11 w-11 shrink-0 items-center justify-center`}>
        <ProfileIconWallet />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
          {d.profile_wallet_heading}
        </p>
        <p className="mt-0.5 truncate text-lg font-bold tabular-nums tracking-tight text-[#1c1917]">
          {total}
        </p>
      </div>
      <ProfileIconChevronRight />
    </Link>
  );
}
