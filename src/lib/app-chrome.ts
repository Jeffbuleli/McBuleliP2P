export function isCommunityRoute(pathname: string): boolean {
  return pathname.startsWith("/app/community");
}

/** Community tab is active on community and academy routes (Academy merged into Community). */
export function isCommunityNavRoute(pathname: string): boolean {
  return isCommunityRoute(pathname) || pathname.startsWith("/app/academy");
}

/** P2P hub — market list benefits from full viewport while scrolling ads. */
export function isP2pHubRoute(pathname: string): boolean {
  return pathname === "/app/p2p";
}

/** Routes where the bottom nav auto-hides on scroll-down (feed-style pages). */
export function bottomNavAutoHide(pathname: string): boolean {
  return isCommunityRoute(pathname) || isP2pHubRoute(pathname);
}
