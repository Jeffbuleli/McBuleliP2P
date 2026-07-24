import type { ReactNode } from "react";
import {
  HackathonThemeShell,
  HACKATHON_THEME_STORAGE,
} from "@/components/hackathon/hackathon-theme-shell";

/** Shared light/dark surface + moon/sun toggle for all /hackathon/* pages. */
export default function HackathonLayout({ children }: { children: ReactNode }) {
  const boot = `(function(){try{var t=localStorage.getItem(${JSON.stringify(HACKATHON_THEME_STORAGE)});if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-hk-theme",t);}}catch(e){}})();`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: boot }} />
      <HackathonThemeShell>{children}</HackathonThemeShell>
    </>
  );
}
