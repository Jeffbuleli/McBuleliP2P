"use client";

import { usePathname } from "next/navigation";
import { LangSwitch } from "@/components/lang-switch";

/** Hide floating lang switch inside authenticated app (language lives in Profile). */
export function ConditionalLangSwitch() {
  const pathname = usePathname();
  if (pathname.startsWith("/app")) return null;
  return (
    <div className="fixed right-3 top-3 z-50 hidden sm:block">
      <LangSwitch />
    </div>
  );
}
