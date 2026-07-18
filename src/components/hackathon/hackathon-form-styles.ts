/** Shared form control classes aligned with McBuleli FD light UI. */

export const hkField =
  "hk-field mt-1 w-full appearance-none rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm text-[color:var(--fd-text)] outline-none transition focus:border-[color:var(--fd-primary)] focus:ring-2 focus:ring-[color:var(--fd-primary)]/15";

export const hkSelect = `${hkField} bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`;

/** Inline SVG chevron for native selects (FD muted). */
export const hkSelectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2357534e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
} as const;

export const hkLabel =
  "block text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]";

export const hkCheckbox =
  "h-4 w-4 shrink-0 rounded border-[color:var(--fd-border)] text-[color:var(--fd-primary)] accent-[#305f33]";

export const hkRadio =
  "h-4 w-4 shrink-0 border-[color:var(--fd-border)] text-[color:var(--fd-primary)] accent-[#305f33]";

/** Chip-style checkbox row (partner types, etc.). */
export const hkCheckChip =
  "flex cursor-pointer items-center gap-2.5 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm font-medium text-[color:var(--fd-text)] transition has-[:checked]:border-[color:var(--fd-primary)]/40 has-[:checked]:bg-[color:var(--fd-mint)]";
