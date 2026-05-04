import Link from "next/link";
import { FuturesTradingClient } from "@/components/trade/futures-trading-client";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function TradeFuturesPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/app/trade"
          className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
        >
          ← {d.trade_ui_back_home}
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
        {d.trade_ui_tab_futures}
      </h1>
      <FuturesTradingClient />
    </div>
  );
}
