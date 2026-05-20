"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUnreadCounts } from "@/lib/use-unread-counts";

type UnreadCountsValue = ReturnType<typeof useUnreadCounts>;

const UnreadCountsContext = createContext<UnreadCountsValue | null>(null);

export function UnreadCountsProvider({ children }: { children: ReactNode }) {
  const value = useUnreadCounts();
  return (
    <UnreadCountsContext.Provider value={value}>{children}</UnreadCountsContext.Provider>
  );
}

export function useUnreadCountsContext(): UnreadCountsValue {
  const ctx = useContext(UnreadCountsContext);
  if (!ctx) {
    throw new Error("useUnreadCountsContext must be used within UnreadCountsProvider");
  }
  return ctx;
}
