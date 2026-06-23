export function isCommunityRoute(pathname: string): boolean {
  return pathname.startsWith("/app/community");
}

/** Community tab is active on community and academy routes (Academy merged into Community). */
export function isCommunityNavRoute(pathname: string): boolean {
  return isCommunityRoute(pathname) || pathname.startsWith("/app/academy");
}

/** Routes where the bottom nav auto-hides on scroll-down (feed-style pages). */
export function bottomNavAutoHide(pathname: string): boolean {
  return isCommunityRoute(pathname);
}
