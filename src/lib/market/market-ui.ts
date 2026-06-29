/** Futuristic HUD tokens for /app/market */

export const MARKET_PAGE =
  "market-theme relative min-h-0";

export const MARKET_TITLE =
  "text-2xl font-black tracking-tight text-stone-50";

export const MARKET_SUBTITLE = "mt-1 text-xs text-stone-400";

export const MARKET_HUD_CARD =
  "market-hud-card group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.94)] shadow-[0_8px_40px_rgba(0,0,0,0.45)]";

export const MARKET_HUD_ACCENT =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent";

export const MARKET_HUD_CORNERS =
  "pointer-events-none absolute inset-0 opacity-60 before:pointer-events-none before:absolute before:left-2 before:top-2 before:h-3 before:w-3 before:border-l before:border-t before:border-cyan-400/50 after:pointer-events-none after:absolute after:bottom-2 after:right-2 after:h-3 after:w-3 after:border-b after:border-r after:border-emerald-400/40";

export const MARKET_TAB_NAV =
  "market-tab-nav sticky top-[calc(env(safe-area-inset-top)+3.25rem)] z-30 rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.92)] p-1 shadow-[0_4px_24px_rgba(0,0,0,0.35)] backdrop-blur-md";

export const MARKET_TAB_BTN =
  "market-tab-btn flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold text-stone-400 transition active:scale-[0.98]";

export const MARKET_TAB_BTN_ACTIVE =
  "market-tab-btn market-tab-btn--active text-cyan-300";

export const MARKET_CHIP =
  "rounded-lg border border-white/10 bg-[rgba(5,8,16,0.65)] px-2.5 py-1 text-[11px] font-semibold text-stone-400 transition active:scale-95";

export const MARKET_CHIP_ACTIVE =
  "rounded-lg border border-cyan-400/35 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.12)]";

export const MARKET_LIVE_PILL =
  "inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300";

export const MARKET_STAT_CELL =
  "rounded-lg border border-white/8 bg-[rgba(5,8,16,0.55)] px-2 py-1.5";

export const MARKET_CTA_LINK =
  "font-bold text-cyan-400 hover:text-cyan-300";

export const MARKET_PRIMARY_BTN =
  "flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/12 py-3 text-sm font-semibold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.1)] transition hover:border-emerald-400/50 active:scale-[0.99]";
