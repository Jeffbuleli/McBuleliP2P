import type { Messages } from "@/i18n/messages";

/** Educational mock - stylized like USDⓈ-M perpetual mobile apps (not interactive). */
export function FuturesScreenMock({ d }: { d: Messages }) {
  const askRows = [
    { p: "80 119.2", a: "4.27" },
    { p: "80 118.7", a: "2.31" },
    { p: "80 118.1", a: "1.09" },
  ];
  const bidRows = [
    { p: "80 117.1", a: "3.42" },
    { p: "80 116.4", a: "5.88" },
    { p: "80 115.9", a: "2.04" },
  ];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 text-stone-900 shadow-inner dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100"
      aria-hidden
    >
      <div className="flex items-center gap-1.5 border-b border-stone-200 px-2 py-1.5 dark:border-stone-700">
        <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
          {d.trade_futures_mock_tab_usdm}
        </span>
        <span className="rounded-md bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-400">
          {d.trade_futures_mock_tab_coinm}
        </span>
        <span className="rounded-md bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-400">
          {d.trade_futures_mock_tab_opts}
        </span>
      </div>

      <div className="flex items-baseline justify-between border-b border-stone-200 px-3 py-2 dark:border-stone-700">
        <div>
          <span className="text-xs font-bold">{d.trade_futures_mock_pair_sample}</span>
          <span className="ml-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {d.trade_futures_mock_change_sample}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-stone-200 dark:bg-stone-800 sm:grid-cols-2">
        {/* Order ticket */}
        <div className="space-y-2 bg-white p-3 dark:bg-stone-900">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {d.trade_futures_mock_order_ticket}
          </p>
          <div className="flex gap-1">
            <span className="rounded border border-stone-300 px-2 py-0.5 text-[10px] font-medium dark:border-stone-600">
              Cross
            </span>
            <span className="rounded border border-stone-300 px-2 py-0.5 text-[10px] font-medium dark:border-stone-600">
              5×
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <span className="rounded-md bg-emerald-600 py-2 text-center text-[11px] font-bold text-white">
              {d.trade_futures_mock_buy_long}
            </span>
            <span className="rounded-md bg-rose-500 py-2 text-center text-[11px] font-bold text-white">
              {d.trade_futures_mock_sell_short}
            </span>
          </div>
          <div className="rounded border border-stone-200 px-2 py-1 text-[10px] dark:border-stone-600">
            {d.trade_futures_mock_limit}
          </div>
          <div className="rounded border border-stone-200 px-2 py-1.5 font-mono text-[11px] tabular-nums dark:border-stone-600">
            78 476.6
          </div>
          <div className="rounded border border-dashed border-stone-300 px-2 py-1 text-[10px] text-stone-500 dark:border-stone-600">
            {d.trade_futures_mock_amount_ph}
          </div>
          <div className="text-[10px] text-stone-500 dark:text-stone-400">
            {d.trade_futures_mock_balance}: 1.50 USDT
          </div>
          <div className="h-1 w-full rounded-full bg-stone-200 dark:bg-stone-700" />
          <p className="text-[9px] leading-tight text-stone-500 dark:text-stone-400">
            {d.trade_futures_mock_tpsl}
          </p>
        </div>

        {/* Book + funding */}
        <div className="flex flex-col bg-white dark:bg-stone-900">
          <div className="border-b border-stone-200 px-2 py-1.5 text-[10px] dark:border-stone-700">
            <span className="font-semibold text-stone-600 dark:text-stone-400">
              {d.trade_futures_mock_funding_label}
            </span>
            <span className="ml-2 font-mono tabular-nums text-stone-800 dark:text-stone-200">
              {d.trade_futures_mock_funding_val}
            </span>
            <span className="ml-2 font-mono text-stone-500 tabular-nums">
              {d.trade_futures_mock_countdown_sample}
            </span>
          </div>

          <div className="flex flex-1 flex-col px-2 py-1">
            <p className="text-[9px] font-semibold uppercase text-rose-600 dark:text-rose-400">
              {d.trade_futures_mock_asks}
            </p>
            <ul className="space-y-0.5 font-mono text-[10px] tabular-nums">
              {askRows.map((row) => (
                <li key={row.p} className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>{row.p}</span>
                  <span className="text-stone-500 dark:text-stone-400">{row.a}</span>
                </li>
              ))}
            </ul>

            <div className="my-1 flex justify-center border-y border-stone-100 py-1 text-center dark:border-stone-800">
              <div>
                <p className="text-[9px] text-stone-500 dark:text-stone-400">
                  {d.trade_futures_mock_mid_label}
                </p>
                <p className="font-mono text-sm font-bold tabular-nums text-stone-900 dark:text-stone-50">
                  80 117.6
                </p>
              </div>
            </div>

            <p className="text-[9px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              {d.trade_futures_mock_bids}
            </p>
            <ul className="space-y-0.5 font-mono text-[10px] tabular-nums">
              {bidRows.map((row) => (
                <li key={row.p} className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>{row.p}</span>
                  <span className="text-stone-500 dark:text-stone-400">{row.a}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-center gap-1">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                <div className="h-full w-[17.62%] bg-emerald-500" />
              </div>
              <span className="text-[9px] tabular-nums text-stone-500">17.62% / 82.38%</span>
            </div>
            <p className="mt-0.5 text-[9px] text-stone-500 dark:text-stone-400">
              {d.trade_futures_mock_long_short}
            </p>
            <p className="mt-1 text-[9px] text-stone-500">
              {d.trade_futures_mock_precision}: 0.1
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-stone-200 bg-stone-100 px-2 py-1.5 text-[10px] dark:border-stone-700 dark:bg-stone-900">
        <span className="font-semibold">{d.trade_futures_mock_positions} (0)</span>
        <span className="text-stone-400">|</span>
        <span>{d.trade_futures_mock_open_orders} (0)</span>
      </div>
    </div>
  );
}
