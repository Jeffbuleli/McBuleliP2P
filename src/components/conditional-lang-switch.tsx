"use client";

import { usePathname } from "next/navigation";
import { LangSwitch } from "@/components/lang-switch";

const AUTH_SHELL_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/confirm-email-change",
  "/account/recovery",
]);

/** Hide when language is provided elsewhere (app profile or auth shell). */
export function ConditionalLangSwitch() {
  const pathname = usePathname();
  if (pathname.startsWith("/app")) return null;
  if (AUTH_SHELL_PATHS.has(pathname)) return null;
  return (
    <div className="fixed right-3 top-3 z-50 hidden sm:block">
      <LangSwitch />
    </div>
  );
}
