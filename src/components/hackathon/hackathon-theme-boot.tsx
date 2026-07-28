"use client";

import { useServerInsertedHTML } from "next/navigation";
import {
  HACKATHON_THEME_DEFAULT,
  HACKATHON_THEME_STORAGE,
} from "@/lib/hackathon/theme-storage";

/** Module-stable boot string — sets `data-hk-theme` before paint to avoid flash. */
const HK_THEME_BOOT = `(function(){try{var k=${JSON.stringify(HACKATHON_THEME_STORAGE)};var d=${JSON.stringify(HACKATHON_THEME_DEFAULT)};var t=localStorage.getItem(k);if(t!=="dark"&&t!=="light")t=d;document.documentElement.setAttribute("data-hk-theme",t);}catch(e){document.documentElement.setAttribute("data-hk-theme",${JSON.stringify(HACKATHON_THEME_DEFAULT)});}})();`;

/** Injects theme boot script during SSR (React 19-safe; no inline <script> in tree). */
export function HackathonThemeBoot() {
  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{ __html: HK_THEME_BOOT }}
      suppressHydrationWarning
    />
  ));
  return null;
}
