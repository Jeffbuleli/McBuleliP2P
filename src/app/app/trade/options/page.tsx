import Link from "next/link";
import { OptionsTradingClient } from "@/components/trade/options-trading-client";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TradeOptionsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="space-y-4 pt-1">
        <Link
          href="/app"
          className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
        >
          ← {d.nav_home}
        </Link>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
        {d.trade_ui_tab_options}
      </h1>
      <OptionsTradingClient />
    </div>
  );
}
