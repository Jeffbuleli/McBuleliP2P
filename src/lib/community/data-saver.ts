/** Mode économie de données — activé par défaut (localStorage). */

const KEY = "mcbuleli_data_saver";

export function isDataSaverEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(KEY);
  if (stored === null) return true;
  return stored === "1";
}

export function setDataSaverEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, enabled ? "1" : "0");
}

/** Qualité image selon Data Saver + réseau. */
export function communityImageVariant(
  variants: Record<string, string> | null | undefined,
  fallback: string,
): string {
  if (!variants) return fallback;
  if (typeof navigator !== "undefined") {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (conn?.saveData || isDataSaverEnabled()) {
      return variants.thumb ?? variants.medium ?? fallback;
    }
  }
  return isDataSaverEnabled()
    ? (variants.medium ?? variants.thumb ?? fallback)
    : (variants.medium ?? variants.original ?? fallback);
}
