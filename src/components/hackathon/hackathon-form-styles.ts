/** Shared form control classes - theme-aware via --fd-* / --hk-* tokens. */

export const hkField =
  "hk-field mt-1 w-full appearance-none rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm text-[color:var(--fd-text)] outline-none transition focus:border-[color:var(--fd-primary)] focus:ring-2 focus:ring-[color:var(--fd-primary)]/15";

export const hkSelect = `${hkField} hk-select cursor-pointer bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;

/** Chevron position only - image comes from `.hackathon-theme select` CSS. */
export const hkSelectChevronStyle = {
  backgroundSize: "1rem",
  backgroundPosition: "right 0.75rem center",
  backgroundRepeat: "no-repeat",
} as const;

export const hkLabel =
  "block text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]";

export const hkCheckbox =
  "hk-check h-4 w-4 shrink-0 cursor-pointer rounded border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] accent-[color:var(--fd-primary)]";

export const hkRadio =
  "hk-check h-4 w-4 shrink-0 cursor-pointer border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] accent-[color:var(--fd-primary)]";

/** Chip-style checkbox row (partner types, etc.). */
export const hkCheckChip =
  "flex cursor-pointer items-center gap-2.5 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm font-medium text-[color:var(--fd-text)] transition hover:bg-[color:var(--fd-mint)]/50 has-[:checked]:border-[color:var(--fd-primary)]/45 has-[:checked]:bg-[color:var(--fd-mint)] has-[:checked]:text-[color:var(--fd-text)]";
