/** Client-side discover suggestions - dismiss & snooze without DB migration. */

const DISMISSED_KEY = "mb_community_discover_dismissed";
const SNOOZE_KEY = "mb_community_discover_snooze_until";

/** Hide a suggested person for 14 days after ignore. */
export const DISCOVER_PERSON_DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

/** Hide the whole suggestions block for 24h. */
export const DISCOVER_BLOCK_SNOOZE_MS = 24 * 60 * 60 * 1000;

/** Max visible cards at once (keeps feed calm). */
export const DISCOVER_VISIBLE_SLOTS = 2;

type DismissMap = Record<string, number>;

function readDismissed(): DismissMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DismissMap;
    if (!parsed || typeof parsed !== "object") return {};
    const now = Date.now();
    const fresh: DismissMap = {};
    for (const [id, until] of Object.entries(parsed)) {
      if (typeof until === "number" && until > now) fresh[id] = until;
    }
    return fresh;
  } catch {
    return {};
  }
}

function writeDismissed(map: DismissMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

export function getDiscoverDismissedUserIds(): string[] {
  return Object.keys(readDismissed());
}

export function dismissDiscoverPerson(userId: string): void {
  const map = readDismissed();
  map[userId] = Date.now() + DISCOVER_PERSON_DISMISS_MS;
  writeDismissed(map);
}

export function isDiscoverBlockSnoozed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const until = localStorage.getItem(SNOOZE_KEY);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

export function snoozeDiscoverBlock(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      SNOOZE_KEY,
      String(Date.now() + DISCOVER_BLOCK_SNOOZE_MS),
    );
  } catch {
    // ignore
  }
}
