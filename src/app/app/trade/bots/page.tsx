import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { BotsTradingClient } from "@/components/trade/bots-trading-client";

export default async function TradeBotsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  return (
    <>
      <BotsTradingClient />
      <p className="mt-8 text-xs text-[color:var(--fd-muted)]">
        {d.bots_disclaimer}
      </p>
    </>
  );
}
