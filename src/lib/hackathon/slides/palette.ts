import type { CSSProperties } from "react";
import type { SlidePalette } from "@/lib/hackathon/slides/types";

/** Lesson accent only — soft/deep/glow derive from --hk-* so light/dark stay readable. */
export const SLIDE_ACCENT: Record<SlidePalette, string> = {
  mint: "#1f6b43",
  forest: "#166534",
  sky: "#0284c7",
  indigo: "#4f46e5",
  amber: "#d97706",
  coral: "#e11d48",
  slate: "#475569",
  violet: "#7c3aed",
};

/** Light-mode soft tints (dark overrides via CSS on [data-hk-theme=dark]). */
export const SLIDE_SOFT_LIGHT: Record<SlidePalette, string> = {
  mint: "#eaf6ee",
  forest: "#dcfce7",
  sky: "#e0f2fe",
  indigo: "#eef2ff",
  amber: "#fef3c7",
  coral: "#ffe4e6",
  slate: "#f1f5f9",
  violet: "#f3e8ff",
};

export function slidePaletteStyle(palette: SlidePalette): CSSProperties {
  const accent = SLIDE_ACCENT[palette];
  const soft = SLIDE_SOFT_LIGHT[palette];
  return {
    ["--slide-accent" as string]: accent,
    ["--slide-soft-raw" as string]: soft,
    ["--slide-soft" as string]:
      "color-mix(in srgb, var(--slide-soft-raw) 88%, var(--hk-surface, #fff))",
    ["--slide-deep" as string]:
      "color-mix(in srgb, var(--slide-accent) 55%, var(--hk-text, #222))",
    ["--slide-glow" as string]:
      "color-mix(in srgb, var(--slide-accent) 28%, transparent)",
    ["--slide-ink" as string]: "var(--hk-text, #222222)",
    ["--slide-muted" as string]: "var(--hk-muted, #8a8a8a)",
    ["--slide-card" as string]: "var(--hk-surface, #ffffff)",
    ["--slide-border" as string]: "var(--hk-border, #e5e5e0)",
  };
}
