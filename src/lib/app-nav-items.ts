import { isCommunityNavRoute } from "@/lib/app-chrome";
import type { Messages } from "@/i18n/messages";

export type AppNavItem = {
  href: string;
  key: keyof Messages;
};

/** Primary app destinations - shared by bottom nav (phone/tablet) and side rail (desktop). */
export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/app", key: "nav_home" },
  { href: "/app/wallet", key: "nav_wallet" },
  { href: "/app/p2p", key: "nav_p2p" },
  { href: "/app/community", key: "nav_community" },
  { href: "/app/profile", key: "nav_profile" },
];

export function isAppNavActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  if (href === "/app/community") return isCommunityNavRoute(pathname);
  return pathname.startsWith(href);
}
