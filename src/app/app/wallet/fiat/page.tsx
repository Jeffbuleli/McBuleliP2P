import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";
import { getWalletUserState } from "@/lib/wallet-user-state";
import { formatWalletAssetBalance } from "@/lib/wallet-balance-format";
import { FiatHubClient } from "@/components/wallet/fiat-hub-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WalletFiatHubPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const locale = await getLocale();
  const state = await getWalletUserState(userId, locale);
  if (!state) redirect("/login");

  const usd = state.lines.find((l) => l.asset === "USD");
  const cdf = state.lines.find((l) => l.asset === "CDF");

  const balances = [
    {
      asset: "USD" as const,
      display: `USD ${formatWalletAssetBalance(usd?.balanceNum ?? 0, "USD", locale)}`,
    },
    {
      asset: "CDF" as const,
      display: `CDF ${formatWalletAssetBalance(cdf?.balanceNum ?? 0, "CDF", locale)}`,
    },
  ];

  void getDictionary(locale);
  return <FiatHubClient balances={balances} />;
}
