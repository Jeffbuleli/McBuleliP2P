"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppBottomNav } from "@/components/mobile/app-bottom-nav";
import { AppSideNav } from "@/components/mobile/app-side-nav";
import { AppTopBar } from "@/components/mobile/app-top-bar";
import { OfflineOverlay } from "@/components/mobile/offline-overlay";
import { UnreadCountsProvider } from "@/components/mobile/unread-counts-provider";
import { KycPostLoginSheet } from "@/components/kyc/kyc-post-login-sheet";
import { KycStatusPoller } from "@/components/kyc/kyc-status-poller";
import { AppIconBadgeSync } from "@/components/pwa/app-icon-badge-sync";
import { useScrollChrome } from "@/hooks/use-scroll-chrome";
import { bottomNavAutoHide, isCommunityRoute, isP2pHubRoute } from "@/lib/app-chrome";

export function AppShell({
  email,
  avatarUrl,
  isSupportStaff = false,
  children,
}: {
  email: string;
  avatarUrl: string | null;
  isSupportStaff?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/app/profile");
  const onHome = pathname === "/app";
  const onWalletFlow = pathname.startsWith("/app/wallet");
  const onP2p = pathname.startsWith("/app/p2p");
  const onP2pHub = isP2pHubRoute(pathname);
  const onSupport = pathname.startsWith("/app/support");
  const onAcademy = pathname.startsWith("/app/academy");
  const onAvecGroupFlow =
    pathname.startsWith("/app/wallet/groups/") &&
    pathname !== "/app/wallet/groups" &&
    !pathname.endsWith("/new");
  const onCommunity = isCommunityRoute(pathname);
  const onMarket = pathname.startsWith("/app/market");
  const onMarche = pathname.startsWith("/app/marche");
  const hideTopBarForFlow =
    pathname.startsWith("/app/wallet/deposit") ||
    pathname.startsWith("/app/wallet/withdraw") ||
    pathname === "/app/wallet/transfer" ||
    onP2pHub ||
    pathname.startsWith("/app/p2p/ad/") ||
    pathname.startsWith("/app/p2p/order/") ||
    pathname.startsWith("/app/support") ||
    onAvecGroupFlow ||
    onMarche;
  const showTopBar = !onProfile && !onCommunity && !hideTopBarForFlow;
  const navAutoHide = bottomNavAutoHide(pathname);
  const navHidden = useScrollChrome(navAutoHide);
  const lightMainBg =
    onProfile ||
    onWalletFlow ||
    onHome ||
    onP2p ||
    onSupport ||
    onAcademy ||
    onCommunity ||
    onMarket ||
    onMarche;
  const shellPb =
    navAutoHide && navHidden
      ? "pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-4"
      : "pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-6";

  return (
    <UnreadCountsProvider>
      <div
        className={`relative mx-auto flex min-h-dvh w-full flex-col pt-[env(safe-area-inset-top)] transition-[padding-bottom] duration-300 ease-out lg:flex-row lg:pt-0 ${shellPb} ${
          onMarche
            ? "max-w-none bg-[color:var(--mk-paper,#f4f7f6)]"
            : "max-w-lg bg-[var(--fd-bg)] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl"
        }`}
      >
        <div className="hidden lg:block">
          <AppSideNav />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {showTopBar ? (
            <div className="sticky top-0 z-40 px-3 pt-2 md:px-4 lg:px-5 lg:pt-4">
              <div className="fd-app-topbar px-2 py-1.5">
                <AppTopBar email={email} avatarUrl={avatarUrl} isSupportStaff={isSupportStaff} />
              </div>
            </div>
          ) : null}
          <main
            className={`flex-1 ${
              onMarche
                ? "px-3 pt-0 sm:px-4 md:px-5 lg:mx-auto lg:w-full lg:max-w-6xl lg:px-6 xl:max-w-7xl"
                : `px-3 sm:px-4 md:px-5 lg:px-6 ${onP2pHub ? "pt-0" : lightMainBg ? "pt-2" : "pt-3"}`
            } ${onSupport ? "!px-0 !pt-0 flex min-h-0 flex-col" : ""}`}
          >
            {children}
          </main>
          <div className="lg:hidden">
            <AppBottomNav hidden={navAutoHide && navHidden} />
          </div>
        </div>
        <AppIconBadgeSync />
        <KycStatusPoller />
        <KycPostLoginSheet />
        <OfflineOverlay />
      </div>
    </UnreadCountsProvider>
  );
}
