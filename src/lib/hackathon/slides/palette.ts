import type { CSSProperties } from "react";
import type { SlidePalette } from "@/lib/hackathon/slides/types";

export const SLIDE_PALETTE_CSS: Record<
  SlidePalette,
  { accent: string; soft: string; deep: string }
> = {
  mint: { accent: "#1f6b43", soft: "#eaf6ee", deep: "#0f3d26" },
  forest: { accent: "#166534", soft: "#dcfce7", deep: "#14532d" },
  sky: { accent: "#0284c7", soft: "#e0f2fe", deep: "#075985" },
  indigo: { accent: "#4f46e5", soft: "#eef2ff", deep: "#312e81" },
  amber: { accent: "#d97706", soft: "#fef3c7", deep: "#92400e" },
  coral: { accent: "#e11d48", soft: "#ffe4e6", deep: "#9f1239" },
  slate: { accent: "#475569", soft: "#f1f5f9", deep: "#1e293b" },
  violet: { accent: "#7c3aed", soft: "#f3e8ff", deep: "#5b21b6" },
};

export function slidePaletteStyle(palette: SlidePalette): CSSProperties {
  const p = SLIDE_PALETTE_CSS[palette];
  return {
    ["--slide-accent" as string]: p.accent,
    ["--slide-soft" as string]: p.soft,
    ["--slide-deep" as string]: p.deep,
  };
}
