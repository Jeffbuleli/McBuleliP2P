"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppBottomNav } from "@/components/mobile/app-bottom-nav";
import { AppTopBar } from "@/components/mobile/app-top-bar";
import { OfflineOverlay } from "@/components/mobile/offline-overlay";

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
  const hideTopBarForFlow =
    pathname.startsWith("/app/deposit") ||
    pathname.startsWith("/app/withdraw") ||
    pathname === "/app/wallet/transfer";
  const lightMainBg = onProfile || onWalletFlow || onHome;
  const showTopBar = !onProfile && !hideTopBarForFlow;

  return (
    <div
      className={`relative mx-auto flex min-h-dvh max-w-lg flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] ${
        lightMainBg ? "bg-[var(--fd-bg)]" : ""
      }`}
    >
      {showTopBar ? (
        <div className="sticky top-0 z-40 px-3 pt-2">
          <div className="rounded-2xl border border-stone-700/50 bg-stone-900/90 shadow-lg shadow-black/20 ring-1 ring-stone-800/80 backdrop-blur-md">
            <div className="px-2 py-1.5">
              <AppTopBar email={email} avatarUrl={avatarUrl} />
            </div>
          </div>
        </div>
      ) : null}
      <main
        className={`flex-1 ${lightMainBg ? "bg-[var(--fd-bg)] px-4 pt-2" : "px-4 pt-3"}`}
      >
        {children}
      </main>
      <AppBottomNav />
      <OfflineOverlay />
    </div>
  );
}
