/** Saturated chip tones — profile light UI (wallet mint unchanged). */
export type ProfileChipTone =
  | "mint"
  | "sky"
  | "amber"
  | "violet"
  | "forest"
  | "copper";

export const profileChipClass: Record<ProfileChipTone, string> = {
  mint: "fd-chip fd-chip-mint",
  sky: "fd-chip fd-chip-sky",
  amber: "fd-chip fd-chip-amber",
  violet: "fd-chip fd-chip-violet",
  forest: "fd-chip fd-chip-forest",
  copper: "fd-chip fd-chip-copper",
};
