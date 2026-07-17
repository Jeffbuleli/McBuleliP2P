const STORAGE_UNTIL = "mb_pwa_install_dismiss_until";
const SESSION_PROMPTED = "mb_pwa_prompted_session";
/** Soft dismiss - user can see the banner again after this. */
export const PWA_DISMISS_MS = 4 * 60 * 60 * 1000;

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isMobileUa(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent,
  );
}

export function installDismissed(): boolean {
  try {
    const until = localStorage.getItem(STORAGE_UNTIL);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(STORAGE_UNTIL, String(Date.now() + PWA_DISMISS_MS));
  } catch {
    // ignore
  }
}

export function markSessionPrompted(): void {
  try {
    sessionStorage.setItem(SESSION_PROMPTED, "1");
  } catch {
    // ignore
  }
}

export function wasPromptedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_PROMPTED) === "1";
  } catch {
    return false;
  }
}

/** Chromium: PWA from this origin already installed (browser tab may still be open). */
export async function hasInstalledRelatedWebApp(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const fn = (
    navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<{ platform?: string; url?: string }[]>;
    }
  ).getInstalledRelatedApps;
  if (!fn) return false;
  try {
    const apps = await fn.call(navigator);
    return apps.some((a) => a.platform === "webapp" || a.url?.includes("manifest"));
  } catch {
    return false;
  }
}

export function shouldRedirectToCanonical(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  const canonical = "mcbuleli.org";
  if (host === canonical || host === `www.${canonical}`) return null;
  if (host.endsWith(".onrender.com") || host === "localhost") return null;
  return `https://${canonical}${window.location.pathname}${window.location.search}`;
}
