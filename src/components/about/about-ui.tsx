import type { ReactNode } from "react";

export { HudFrame, HUD_PANEL_LG, type HudAccent } from "@/components/ui/hud-frame";

/** Rotating HUD ornament - decorative only. */
export function HudOrbit({ label }: { label: string }) {
  return (
    <div className="relative mx-auto flex aspect-square max-w-[220px] items-center justify-center" aria-hidden>
      <div className="absolute inset-0 animate-[spin_28s_linear_infinite] rounded-full border border-dashed border-cyan-500/20" />
      <div className="absolute inset-4 animate-[spin_18s_linear_infinite_reverse] rounded-full border border-emerald-400/25" />
      <div className="absolute inset-8 animate-[spin_12s_linear_infinite] rounded-full border border-fuchsia-500/20" />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_24px_-4px_rgba(34,211,238,0.5)]">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.8)]" />
      </div>
      <p className="absolute -bottom-1 left-0 right-0 text-center font-mono text-[8px] uppercase tracking-[0.28em] text-stone-600">
        {label}
      </p>
    </div>
  );
}
