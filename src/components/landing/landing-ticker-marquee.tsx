"use client";

import { marketIconUrl } from "@/lib/market-icons";
import type { MarketTicker } from "@/lib/market-tickers";

function formatPrice(symbol: string, price: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  if (symbol.startsWith("BTC")) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 100) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function TickerChip({ t }: { t: MarketTicker }) {
  const up = t.changePct >= 0;
  const base = t.symbol.replace("USDT", "");
  const icon = marketIconUrl(t.symbol);
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-1.5 shadow-sm">
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="h-5 w-5 rounded-full" width={20} height={20} />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[9px] font-black text-[color:var(--fd-primary)]">
          {base.slice(0, 1)}
        </span>
      )}
      <span className="text-xs font-extrabold text-[color:var(--fd-text)]">{base}</span>
      <span className="text-xs font-semibold tabular-nums text-[color:var(--fd-muted)]">
        ${formatPrice(t.symbol, t.lastPrice)}
      </span>
      <span
        className={`text-[11px] font-bold tabular-nums ${up ? "text-emerald-600" : "text-rose-600"}`}
      >
        {up ? "+" : ""}
        {t.changePct.toFixed(2)}%
      </span>
    </div>
  );
}

export function LandingTickerMarquee({ tickers }: { tickers: MarketTicker[] | null }) {
  if (!tickers?.length) return null;

  const row = [...tickers, ...tickers];

  return (
    <div className="landing-ticker-marquee mt-4 overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] py-2.5">
      <div className="landing-ticker-marquee-track flex w-max items-center gap-3 px-3">
        {row.map((t, i) => (
          <TickerChip key={`${t.symbol}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}
