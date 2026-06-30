"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, className = "", ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    className,
    "aria-hidden": true as const,
    ...props,
  };
}

/* —— Feed actions —— */
export function IconFeedOpen(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M12 5v14M8 11l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFeedClose(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <rect x="6" y="6" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function IconFeedSmartExit(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M12 3v6l4 2-6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFeedWatch(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function IconFeedBuy(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconFeedGrid(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M5 5h5v5H5V5zm9 0h5v5h-5V5zM5 14h5v5H5v-5zm9 0h5v5h-5v-5z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconFeedSkip(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconFeedAi(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFeedError(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v5M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconFeedBreakeven(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 8v8M16 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconFeedTrailing(p: IconProps) {
  const s = base({ size: 16, ...p });
  return (
    <svg {...s}>
      <path d="M6 18L18 6M14 6h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRefresh(p: IconProps) {
  const s = base({ size: 14, ...p });
  return (
    <svg {...s}>
      <path d="M4 12a8 8 0 0113.5-5.5M20 12a8 8 0 01-13.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 5.5h3.5V2M4 18.5H.5V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  const s = base({ size: 12, ...p });
  return (
    <svg {...s}>
      <path d="M6 12l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type BotFeedAction =
  | "futures_open"
  | "futures_sl_close"
  | "futures_tp_close"
  | "futures_smart_close"
  | "smart_exit_hold"
  | "futures_breakeven_armed"
  | "futures_trailing_close"
  | "dca_buy"
  | "grid_refresh"
  | "smart_skip"
  | "ai_skip"
  | "decision_skip"
  | "tick_skip"
  | "error";

export function BotFeedActionIcon({
  action,
  className = "text-current",
  size = 16,
}: {
  action: string;
  className?: string;
  size?: number;
}) {
  const p = { size, className };
  switch (action as BotFeedAction) {
    case "futures_open":
      return <IconFeedOpen {...p} />;
    case "futures_sl_close":
    case "futures_tp_close":
      return <IconFeedClose {...p} />;
    case "futures_smart_close":
      return <IconFeedSmartExit {...p} />;
    case "smart_exit_hold":
      return <IconFeedWatch {...p} />;
    case "futures_breakeven_armed":
      return <IconFeedBreakeven {...p} />;
    case "futures_trailing_close":
      return <IconFeedTrailing {...p} />;
    case "dca_buy":
      return <IconFeedBuy {...p} />;
    case "grid_refresh":
      return <IconFeedGrid {...p} />;
    case "ai_skip":
      return <IconFeedAi {...p} />;
    case "decision_skip":
    case "smart_skip":
      return <IconFeedSkip {...p} />;
    case "tick_skip":
      return <IconCronMinimal {...p} />;
    case "error":
      return <IconFeedError {...p} />;
    default:
      return <IconFeedDot {...p} />;
  }
}

function IconCronMinimal(p: IconProps) {
  const s = base(p);
  return (
    <svg {...s}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconFeedDot(p: IconProps) {
  const s = base({ size: 8, ...p });
  return (
    <svg {...s}>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

/* —— Decision / reason —— */
export function IconCatTechnical(p: IconProps) {
  const s = base({ size: 20, ...p });
  return (
    <svg {...s}>
      <path d="M4 16l4-8 4 5 4-9 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCatAi(p: IconProps) {
  return <IconFeedAi size={20} className={p.className} />;
}

export function IconCatRisk(p: IconProps) {
  const s = base({ size: 20, ...p });
  return (
    <svg {...s}>
      <path d="M12 4l8 14H4L12 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v4M12 17v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconCatExecution(p: IconProps) {
  const s = base({ size: 20, ...p });
  return (
    <svg {...s}>
      <path d="M13 3L4 14h6l-1 7 9-12h-7l2-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCatSystem(p: IconProps) {
  const s = base({ size: 20, ...p });
  return (
    <svg {...s}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DecisionCategoryIcon({
  category,
  className = "text-[color:var(--fd-muted)]",
  size = 14,
}: {
  category?: string;
  className?: string;
  size?: number;
}) {
  const p = { size, className };
  const c = (category ?? "").toUpperCase();
  if (c === "TECHNICAL") return <IconCatTechnical {...p} />;
  if (c === "AI") return <IconCatAi {...p} />;
  if (c === "RISK") return <IconCatRisk {...p} />;
  if (c === "EXECUTION") return <IconCatExecution {...p} />;
  return <IconCatSystem {...p} />;
}

export function DecisionReasonIcon({
  code,
  className = "text-[color:var(--fd-text)]",
}: {
  code: string;
  className?: string;
}) {
  const c = code.toUpperCase();
  if (c.includes("TREND")) return <IconTrendConflict className={className} />;
  if (c.includes("SCORE") || c.includes("MOMENTUM")) return <IconLowSignal className={className} />;
  if (c.includes("VOLATIL")) return <IconVolatility className={className} />;
  if (c.includes("MACRO") || c.includes("NEWS")) return <IconCatRisk className={className} />;
  if (c.includes("COOLDOWN") || c.includes("INTERVAL")) return <IconCatSystem className={className} />;
  if (c.includes("NOTIONAL") || c.includes("BINANCE")) return <IconCatExecution className={className} />;
  return <IconFeedSkip className={className} />;
}

function IconTrendConflict(p: IconProps) {
  const s = base({ size: 20, ...p });
  return (
    <svg {...s}>
      <path d="M7 8h10M7 16h10M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconLowSignal(p: IconProps) {
  const s = base({ size: 20, ...p });
  return (
    <svg {...s}>
      <path d="M12 19V5M8 9l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </svg>
  );
}

function IconVolatility(p: IconProps) {
  const s = base({ size: 20, ...p });
  return (
    <svg {...s}>
      <path d="M4 14l3-5 3 4 3-7 3 8 4-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* —— Chips (metadata pills) —— */
export type BotChipKind =
  | "symbol"
  | "side_long"
  | "side_short"
  | "quote"
  | "margin"
  | "leverage"
  | "signal"
  | "score"
  | "factor"
  | "orders"
  | "mark"
  | "entry"
  | "pnl"
  | "trigger"
  | "peak"
  | "retrace"
  | "timeframe"
  | "order_id"
  | "ta"
  | "ai";

export function BotChipIcon({
  kind,
  className = "opacity-60",
}: {
  kind: BotChipKind;
  className?: string;
}) {
  const p = { size: 12, className };
  switch (kind) {
    case "side_long":
      return <IconFeedOpen {...p} />;
    case "side_short":
      return (
        <svg {...base(p)}>
          <path d="M12 5v14M8 13l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "quote":
    case "margin":
      return (
        <svg {...base(p)}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M12 8v8M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "leverage":
      return (
        <svg {...base(p)}>
          <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2" />
          <path d="M4 4h4M16 4h4M4 20h4M16 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "signal":
    case "ta":
      return <IconCatTechnical {...p} />;
    case "ai":
      return <IconFeedAi {...p} />;
    case "score":
      return <IconLowSignal {...p} />;
    case "orders":
      return (
        <svg {...base(p)}>
          <path d="M6 6h12v4H6V6zm0 8h12v4H6v-4z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "mark":
    case "entry":
      return (
        <svg {...base(p)}>
          <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case "pnl":
      return <IconCatTechnical {...p} />;
    case "timeframe":
      return <IconCatSystem {...p} />;
    case "order_id":
      return (
        <svg {...base(p)}>
          <path d="M8 8h8v8H8V8z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <svg {...base(p)}>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
  }
}
