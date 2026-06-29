import type { ReactNode } from "react";

/** Corner bracket tone - buy = emerald, sell = amber, dual = split, spectral = 4-color HUD, neutral = cyan. */
export type HudCornerTone = "neutral" | "buy" | "sell" | "dual" | "spectral";

const TONE: Record<
  HudCornerTone,
  { tl: string; tr: string; bl: string; br: string }
> = {
  neutral: {
    tl: "border-cyan-400/50",
    tr: "border-cyan-400/50",
    bl: "border-cyan-400/50",
    br: "border-cyan-400/50",
  },
  buy: {
    tl: "border-emerald-400/55",
    tr: "border-emerald-400/55",
    bl: "border-emerald-400/55",
    br: "border-emerald-400/55",
  },
  sell: {
    tl: "border-amber-400/55",
    tr: "border-amber-400/55",
    bl: "border-amber-400/55",
    br: "border-amber-400/55",
  },
  dual: {
    tl: "border-emerald-400/55",
    tr: "border-amber-400/55",
    bl: "border-amber-400/55",
    br: "border-emerald-400/55",
  },
  spectral: {
    tl: "border-cyan-400/55",
    tr: "border-fuchsia-400/50",
    bl: "border-emerald-400/50",
    br: "border-amber-400/45",
  },
};

const SIZE = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
} as const;

const BORDER: Record<keyof typeof SIZE, string> = {
  xs: "border-l border-t",
  sm: "border-l border-t",
  md: "border-l-2 border-t-2",
  lg: "border-l-2 border-t-2",
};

const BORDER_R: Record<keyof typeof SIZE, string> = {
  xs: "border-r border-t",
  sm: "border-r border-t",
  md: "border-r-2 border-t-2",
  lg: "border-r-2 border-t-2",
};

const BORDER_B_L: Record<keyof typeof SIZE, string> = {
  xs: "border-b border-l",
  sm: "border-b border-l",
  md: "border-b-2 border-l-2",
  lg: "border-b-2 border-l-2",
};

const BORDER_B_R: Record<keyof typeof SIZE, string> = {
  xs: "border-b border-r",
  sm: "border-b border-r",
  md: "border-b-2 border-r-2",
  lg: "border-b-2 border-r-2",
};

export function hudCornerToneFromMarket(
  hasMakerBuyAds: boolean,
  hasMakerSellAds: boolean,
): HudCornerTone {
  if (hasMakerBuyAds && hasMakerSellAds) return "dual";
  if (hasMakerSellAds) return "buy";
  if (hasMakerBuyAds) return "sell";
  return "neutral";
}

export function hudCornerToneFromAdSide(side: string): HudCornerTone {
  return side === "buy" ? "buy" : "sell";
}

export function HudCornerBrackets({
  tone = "neutral",
  size = "md",
  animated = false,
  className = "",
}: {
  tone?: HudCornerTone;
  size?: keyof typeof SIZE;
  animated?: boolean;
  className?: string;
}) {
  const c = TONE[tone];
  const sz = SIZE[size];
  const pulse = animated ? "hud-corner-bracket hud-corner-bracket--pulse" : "hud-corner-bracket";

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <span
        className={`${pulse} absolute left-0 top-0 ${BORDER[size]} ${sz} ${c.tl} ${animated ? "hud-corner-bracket--d0" : ""}`}
      />
      <span
        className={`${pulse} absolute right-0 top-0 ${BORDER_R[size]} ${sz} ${c.tr} ${animated ? "hud-corner-bracket--d1" : ""}`}
      />
      <span
        className={`${pulse} absolute bottom-0 left-0 ${BORDER_B_L[size]} ${sz} ${c.bl} ${animated ? "hud-corner-bracket--d2" : ""}`}
      />
      <span
        className={`${pulse} absolute bottom-0 right-0 ${BORDER_B_R[size]} ${sz} ${c.br} ${animated ? "hud-corner-bracket--d3" : ""}`}
      />
    </div>
  );
}

export function HudCornerFrame({
  children,
  tone = "neutral",
  size = "md",
  animated = false,
  className = "",
  label,
}: {
  children: ReactNode;
  tone?: HudCornerTone;
  size?: keyof typeof SIZE;
  animated?: boolean;
  className?: string;
  label?: string;
}) {
  const labelCls =
    tone === "buy"
      ? "text-emerald-400/80"
      : tone === "sell"
        ? "text-amber-400/80"
        : tone === "dual"
          ? "text-cyan-400/80"
          : "text-cyan-400/80";

  return (
    <div className={`relative ${className}`}>
      <HudCornerBrackets tone={tone} size={size} animated={animated} />
      {label ? (
        <p className={`mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] ${labelCls}`}>
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}
