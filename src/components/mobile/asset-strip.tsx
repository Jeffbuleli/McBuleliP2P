import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";
import { WalletAssetIcon, assetDetailHref } from "@/components/wallet/wallet-asset-icon";
import type { WalletAsset } from "@/lib/wallet-types";

type AssetRow = {
  asset: WalletAsset;
  code: string;
  name: string;
  balance: string;
};

export function AssetStrip({
  locale,
  usdtBalance,
  piBalance,
  usdBalance,
  cdfBalance,
}: {
  locale: Locale;
  usdtBalance: string;
  piBalance: string;
  usdBalance: string;
  cdfBalance: string;
}) {
  const d = getDictionary(locale);

  const assets: AssetRow[] = [
    {
      asset: "USDT",
      code: "USDT",
      name: d.asset_row_usdt_name,
      balance: usdtBalance,
    },
    {
      asset: "PI",
      code: "Pi",
      name: d.asset_row_pi_name,
      balance: piBalance,
    },
    {
      asset: "USD",
      code: "USD",
      name: d.asset_row_usd_name,
      balance: usdBalance,
    },
    {
      asset: "CDF",
      code: "CDF",
      name: d.asset_row_cdf_name,
      balance: cdfBalance,
    },
  ];

  return (
    <section aria-label={d.assets_title}>
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 className="fd-section-title">{d.assets_title}</h2>
        <Link href="/app/wallet" className="text-xs font-semibold text-[color:var(--fd-primary)]">
          {d.wallet_see_all} →
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {assets.map((a) => (
          <li key={a.asset}>
            <Link
              href={assetDetailHref(a.asset)}
              className="fd-card wallet-asset-row flex min-w-0 flex-col p-3 transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <WalletAssetIcon asset={a.asset} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[color:var(--fd-text)]">{a.code}</p>
                  <p className="truncate text-[9px] text-[color:var(--fd-muted)]">{a.name}</p>
                </div>
              </div>
              <p className="mt-2 truncate text-center text-[11px] font-semibold tabular-nums text-[color:var(--fd-text)]">
                {a.balance}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
