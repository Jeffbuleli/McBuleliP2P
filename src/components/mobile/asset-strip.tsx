import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

type Row = {
  code: string;
  name: string;
  sub: string;
  balance: string;
  icon: string;
};

export function AssetStrip({
  locale,
  usdtBalance,
  piBalance,
}: {
  locale: Locale;
  usdtBalance: string;
  piBalance: string;
}) {
  const d = getDictionary(locale);

  const assets: Row[] = [
    {
      code: "USDT",
      name: d.asset_row_usdt_name,
      sub: d.asset_row_usdt_sub,
      balance: usdtBalance,
      icon: "/assets/crypto/usdt.png",
    },
    {
      code: "Pi",
      name: d.asset_row_pi_name,
      sub: d.asset_row_pi_sub,
      balance: piBalance,
      icon: "/assets/crypto/pi.png",
    },
  ];

  return (
    <section aria-label={d.assets_title}>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="fd-section-title">{d.assets_title}</h2>
        <Link
          href="/app/wallet"
          className="text-xs font-semibold text-[color:var(--fd-primary)]"
        >
          {d.wallet_see_all} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {assets.map((a) => (
          <Link
            key={a.code}
            href="/app/wallet"
            className="fd-card flex min-w-0 flex-col p-3 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-[color:var(--fd-border)]">
                <Image
                  src={a.icon}
                  alt=""
                  width={36}
                  height={36}
                  className="object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-tight text-[color:var(--fd-text)]">
                  {a.code}
                </p>
                <p className="truncate text-[9px] leading-tight text-[color:var(--fd-muted)]">
                  {a.name}
                </p>
              </div>
            </div>
            <p className="mt-2 truncate text-center text-[11px] font-semibold tabular-nums leading-tight text-[color:var(--fd-text)]">
              {a.balance}
            </p>
            <p className="mt-0.5 truncate text-center text-[8px] text-[color:var(--fd-muted)]">
              {a.sub}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
