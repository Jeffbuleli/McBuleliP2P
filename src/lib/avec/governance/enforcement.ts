/** Returned when a manager-only shortcut is blocked — members must vote instead. */
export const GOV_COLLECTIVE_REQUIRED = "group_gov_collective_required" as const;

export function govCollectiveRequired(): {
  ok: false;
  message: typeof GOV_COLLECTIVE_REQUIRED;
} {
  return { ok: false, message: GOV_COLLECTIVE_REQUIRED };
}
