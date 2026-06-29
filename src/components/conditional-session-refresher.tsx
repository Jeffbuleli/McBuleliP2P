"use client";

import { usePathname } from "next/navigation";
import { SessionRefresher } from "@/components/auth/session-refresher";

/** Session refresh only inside the app - avoids 401 noise on landing/legal pages. */
export function ConditionalSessionRefresher() {
  const pathname = usePathname();
  if (!pathname.startsWith("/app")) return null;
  return <SessionRefresher />;
}
