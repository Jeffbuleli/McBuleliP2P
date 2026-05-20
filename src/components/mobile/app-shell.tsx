"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppBottomNav } from "@/components/mobile/app-bottom-nav";
import { AppTopBar } from "@/components/mobile/app-top-bar";
import { OfflineOverlay } from "@/components/mobile/offline-overlay";
import { UnreadCountsProvider } from "@/components/mobile/unread-counts-provider";
import { AppIconBadgeSync } from "@/components/pwa/app-icon-badge-sync";

export function AppShell({
  email,
  avatarUrl,
  children,
}: {
  email: string;
  avatarUrl: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const onProfile = pathname.startsWith("/app/profile");
  const onHome = pathname === "/app";
  const onWalletFlow =
    pathname.startsWith("/app/wallet") ||
    pathname.startsWith("/app/deposit") ||
    pathname.startsWith("/app/withdraw");
  const onP2p = pathname.startsWith("/app/p2p");
  const onSupport = pathname.startsWith("/app/support");
  const hideTopBarForFlow =
    pathname.startsWith("/app/deposit") ||
    pathname.startsWith("/app/withdraw") ||
    pathname === "/app/wallet/transfer" ||
    pathname.startsWith("/app/p2p/ad/") ||
    pathname.startsWith("/app/p2p/order/") ||
    pathname.startsWith("/app/support");
  const showTopBar = !onProfile && !hideTopBarForFlow;
  const lightMainBg = onProfile || onWalletFlow || onHome || onP2p || onSupport;

  return (
    <UnreadCountsProvider>
    <div
      className={`relative mx-auto flex min-h-dvh max-w-lg flex-col bg-[var(--fd-bg)] pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]`}
    >
      {showTopBar ? (
        <div className="sticky top-0 z-40 px-3 pt-2">
          <div className="fd-app-topbar px-2 py-1.5">
            <AppTopBar email={email} avatarUrl={avatarUrl} />
          </div>
        </div>
      ) : null}
      <main
        className={`flex-1 px-4 ${lightMainBg ? "pt-2" : "pt-3"} ${onSupport ? "!px-0 !pt-0 flex min-h-0 flex-col" : ""}`}
      >
        {children}
      </main>
      <AppBottomNav />
      <AppIconBadgeSync />
      <OfflineOverlay />
    </div>
    </UnreadCountsProvider>
  );
}
