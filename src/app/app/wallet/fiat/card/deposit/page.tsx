import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import WalletFiatCardDepositClient from "./wallet-fiat-card-deposit-client";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";
import { getSessionUserId } from "@/lib/session";
import { redirectToLoginPreservingPath } from "@/lib/auth-return-path-server";

export const dynamic = "force-dynamic";

export default async function WalletFiatCardDepositPage() {
  const userId = await getSessionUserId();
  if (!userId) await redirectToLoginPreservingPath();

  const locale = await getLocale();
  const d = getDictionary(locale);
  const fiatPaused = isFiatDepositWithdrawPaused();

  return (
    <div className="wallet-theme flex min-h-[70vh] flex-col pb-4">
      <WalletSubpageHeader title={d.wallet_fiat_card_deposit_title} backHref="/app/wallet" />
      <WalletFiatCardDepositClient fiatPaused={fiatPaused} />
      <div className="mt-auto">
        <McBuleliPoweredFooter />
      </div>
    </div>
  );
}
