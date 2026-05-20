/** PWA / installed app icon badge (Chrome, Edge, Safari 17+). */
export async function syncAppIconBadge(totalUnread: number): Promise<void> {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    setAppBadge?: (contents: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (totalUnread > 0 && typeof nav.setAppBadge === "function") {
      await nav.setAppBadge(Math.min(99, Math.floor(totalUnread)));
    } else if (typeof nav.clearAppBadge === "function") {
      await nav.clearAppBadge();
    }
  } catch {
    /* unsupported or denied */
  }
}
