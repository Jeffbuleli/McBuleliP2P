"use client";

import type { ReactNode } from "react";
import { AppBottomNav } from "@/components/mobile/app-bottom-nav";
import { AppTopBar } from "@/components/mobile/app-top-bar";
import { InstallAppBanner } from "@/components/mobile/install-app-banner";
import { OfflineOverlay } from "@/components/mobile/offline-overlay";

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
      <div className="sticky top-0 z-40 px-3 pt-2">
        <div className="rounded-2xl border border-stone-700/50 bg-stone-900/90 shadow-lg shadow-black/20 ring-1 ring-stone-800/80 backdrop-blur-md">
          <div className="px-2 py-1.5">
            <AppTopBar email={email} />
          </div>
        </div>
      </div>
      <main className="flex-1 px-4 pt-3">{children}</main>
      <AppBottomNav />
      <OfflineOverlay />
      <InstallAppBanner />
    </div>
  );
}
