import type { ReactNode } from "react";
import { HackathonThemeShell } from "@/components/hackathon/hackathon-theme-shell";
import {
  HACKATHON_THEME_DEFAULT,
  HACKATHON_THEME_STORAGE,
} from "@/lib/hackathon/theme-storage";

/** Module-stable boot string (shared non-client key) — prevents script hydration drift. */
const HK_THEME_BOOT = `(function(){try{var k=${JSON.stringify(HACKATHON_THEME_STORAGE)};var d=${JSON.stringify(HACKATHON_THEME_DEFAULT)};var t=localStorage.getItem(k);if(t!=="dark"&&t!=="light")t=d;document.documentElement.setAttribute("data-hk-theme",t);}catch(e){document.documentElement.setAttribute("data-hk-theme",${JSON.stringify(HACKATHON_THEME_DEFAULT)});}})();`;

/** Shared dark/light surface + moon/sun toggle for all /hackathon/* pages (dark by default). */
export default function HackathonLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: HK_THEME_BOOT }}
        suppressHydrationWarning
      />
      <HackathonThemeShell>{children}</HackathonThemeShell>
    </>
  );
}
