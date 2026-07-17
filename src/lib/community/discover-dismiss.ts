/**
 * Client-side discover UX: soft "Later", short rotation, personal dismiss.
 * "Later" never permanently removes suggestions - it only spaces them out.
 */

const DISMISSED_KEY = "mb_community_discover_dismissed";
const DEFERRED_KEY = "mb_community_discover_deferred";
const SNOOZE_UNTIL_KEY = "mb_community_discover_snooze_until";
const SNOOZE_STREAK_KEY = "mb_community_discover_snooze_streak";
const LAST_SHOWN_KEY = "mb_community_discover_last_shown";

/** Ignore (×) a person for 7 days - explicit skip, not "Later". */
export const DISCOVER_PERSON_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

/** After "Later", rotate these faces out briefly so the next wave differs. */
export const DISCOVER_PERSON_DEFER_MS = 6 * 60 * 60 * 1000;

/** Progressive "Later" windows (hours) - soft, not a hard ban. */
const SNOOZE_HOURS = [2, 4, 8, 12] as const;

/** Max visible cards at once. */
export const DISCOVER_VISIBLE_SLOTS = 2;

type UntilMap = Record<string, number>;

function readUntilMap(key: string): UntilMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UntilMap;
    if (!parsed || typeof parsed !== "object") return {};
    const now = Date.now();
    const fresh: UntilMap = {};
    for (const [id, until] of Object.entries(parsed)) {
      if (typeof until === "number" && until > now) fresh[id] = until;
    }
    return fresh;
  } catch {
    return {};
  }
}

function writeUntilMap(key: string, map: UntilMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

function mergeExcludeIds(...maps: UntilMap[]): string[] {
  const ids = new Set<string>();
  for (const map of maps) {
    for (const id of Object.keys(map)) ids.add(id);
  }
  return [...ids];
}

export function getDiscoverExcludeUserIds(): string[] {
  return mergeExcludeIds(readUntilMap(DISMISSED_KEY), readUntilMap(DEFERRED_KEY));
}

/** @deprecated use getDiscoverExcludeUserIds */
export function getDiscoverDismissedUserIds(): string[] {
  return getDiscoverExcludeUserIds();
}

export function dismissDiscoverPerson(userId: string): void {
  const map = readUntilMap(DISMISSED_KEY);
  map[userId] = Date.now() + DISCOVER_PERSON_DISMISS_MS;
  writeUntilMap(DISMISSED_KEY, map);
}

/** Soft rotate: hide these faces for a few hours so the next batch varies. */
export function deferDiscoverPeople(userIds: string[]): void {
  if (userIds.length === 0) return;
  const map = readUntilMap(DEFERRED_KEY);
  const until = Date.now() + DISCOVER_PERSON_DEFER_MS;
  for (const id of userIds) map[id] = until;
  writeUntilMap(DEFERRED_KEY, map);
}

export function isDiscoverBlockSnoozed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const until = localStorage.getItem(SNOOZE_UNTIL_KEY);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

export function getDiscoverSnoozeRemainingMs(): number {
  if (typeof window === "undefined") return 0;
  try {
    const until = Number(localStorage.getItem(SNOOZE_UNTIL_KEY) ?? 0);
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

/**
 * "Later" = pause briefly with progressive spacing, rotate current faces,
 * then suggestions come back automatically - never a permanent dismiss.
 */
export function snoozeDiscoverBlock(visibleUserIds: string[] = []): {
  hours: number;
} {
  if (typeof window === "undefined") return { hours: SNOOZE_HOURS[0] };

  deferDiscoverPeople(visibleUserIds);

  let streak = 0;
  try {
    streak = Number(localStorage.getItem(SNOOZE_STREAK_KEY) ?? "0") || 0;
  } catch {
    streak = 0;
  }
  const idx = Math.min(streak, SNOOZE_HOURS.length - 1);
  const hours = SNOOZE_HOURS[idx]!;
  const until = Date.now() + hours * 60 * 60 * 1000;

  try {
    localStorage.setItem(SNOOZE_UNTIL_KEY, String(until));
    localStorage.setItem(SNOOZE_STREAK_KEY, String(streak + 1));
    if (visibleUserIds.length) {
      localStorage.setItem(LAST_SHOWN_KEY, JSON.stringify(visibleUserIds));
    }
  } catch {
    // ignore
  }

  return { hours };
}

/** Call when suggestions successfully show again - ease the streak. */
export function noteDiscoverShown(): void {
  if (typeof window === "undefined") return;
  try {
    const streak = Number(localStorage.getItem(SNOOZE_STREAK_KEY) ?? "0") || 0;
    if (streak > 0) {
      localStorage.setItem(SNOOZE_STREAK_KEY, String(Math.max(0, streak - 1)));
    }
  } catch {
    // ignore
  }
}
