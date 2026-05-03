import Image from "next/image";
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
  fiatUsdApprox,
  fiatCdfApprox,
}: {
  locale: Locale;
  usdtBalance: string;
  piBalance: string;
  fiatUsdApprox: string;
  fiatCdfApprox: string;
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
    {
      code: "CDF",
      name: d.asset_row_cdf_name,
      sub: d.asset_row_cdf_sub,
      balance: fiatCdfApprox,
      icon: "/assets/crypto/cdf.png",
    },
    {
      code: "USD",
      name: d.asset_row_usd_name,
      sub: d.asset_row_usd_sub,
      balance: fiatUsdApprox,
      icon: "/assets/crypto/usd.png",
    },
  ];

  return (
    <section aria-label={d.assets_title}>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
          {d.assets_title}
        </h2>
      </div>
      <div className="grid grid-cols-2 justify-items-stretch gap-2 sm:grid-cols-4">
        {assets.map((a) => (
          <div
            key={a.code}
            className="flex min-w-0 flex-col rounded-2xl border border-emerald-900/10 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-stone-900"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-stone-200/80 dark:ring-stone-600">
                <Image
                  src={a.icon}
                  alt=""
                  width={36}
                  height={36}
                  className="object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-tight text-stone-900 dark:text-stone-50">
                  {a.code}
                </p>
                <p className="truncate text-[9px] leading-tight text-stone-500 dark:text-stone-400">
                  {a.name}
                </p>
              </div>
            </div>
            <p className="mt-2 truncate text-center text-[11px] font-semibold tabular-nums leading-tight text-stone-900 dark:text-stone-100">
              {a.balance}
            </p>
            <p className="mt-0.5 truncate text-center text-[8px] text-stone-400 dark:text-stone-500">
              {a.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
