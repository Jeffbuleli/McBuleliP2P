import type { ReactNode } from "react";
import {
  HudCornerBrackets,
  type HudCornerTone,
} from "@/components/ui/hud-corners";

export type HudAccent = "cyan" | "magenta" | "green" | "amber";

const CORNER: Record<HudAccent, string> = {
  cyan: "border-cyan-400/50",
  magenta: "border-fuchsia-500/45",
  green: "border-emerald-400/50",
  amber: "border-amber-400/50",
};

const LABEL: Record<HudAccent, string> = {
  cyan: "text-cyan-400/80",
  magenta: "text-fuchsia-400/80",
  green: "text-emerald-400/80",
  amber: "text-amber-400/80",
};

/** Large panel shell: sharp corners + HUD bracket accents. */
export const HUD_PANEL_LG = "border border-white/10 bg-[#0a1018]/90 backdrop-blur-sm";

/** HUD corner brackets on large sharp panels. */
export function HudFrame({
  children,
  className = "",
  label,
  accent = "cyan",
  cornerTone,
  cornerAnimated = false,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  accent?: HudAccent;
  /** When set, overrides uniform `accent` with buy/sell/dual corner colors. */
  cornerTone?: HudCornerTone;
  cornerAnimated?: boolean;
}) {
  const c = CORNER[accent];
  const labelTone =
    cornerTone === "buy"
      ? "text-emerald-400/80"
      : cornerTone === "sell"
        ? "text-amber-400/80"
        : cornerTone === "dual"
          ? "text-cyan-400/80"
          : LABEL[accent];

  return (
    <div className={`relative ${className}`}>
      {cornerTone ? (
        <HudCornerBrackets tone={cornerTone} size="md" animated={cornerAnimated} />
      ) : (
        <>
          <span className={`pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 ${c}`} aria-hidden />
          <span className={`pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 ${c}`} aria-hidden />
          <span className={`pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 ${c}`} aria-hidden />
          <span className={`pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 ${c}`} aria-hidden />
        </>
      )}
      {label ? (
        <p className={`mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] ${labelTone}`}>
          {label}
        </p>
      ) : null}
      {children}
    </div>
  );
}
