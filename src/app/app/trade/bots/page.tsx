import { BotsDisclaimerStrip } from "@/components/trade/bots-page-chrome";
import { BotsTradingClient } from "@/components/trade/bots-trading-client";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TradeBotsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  return (
    <>
      <BotsTradingClient />
      <BotsDisclaimerStrip
        labels={{
          aria: d.bots_disclaimer_aria,
          orders: d.bots_disclaimer_orders,
          custody: d.bots_disclaimer_custody,
          nfa: d.bots_disclaimer_nfa,
        }}
      />
    </>
  );
}
