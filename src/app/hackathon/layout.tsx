import type { ReactNode } from "react";
import { HackathonThemeBoot } from "@/components/hackathon/hackathon-theme-boot";
import { HackathonThemeShell } from "@/components/hackathon/hackathon-theme-shell";

/** Shared dark/light surface + moon/sun toggle for all /hackathon/* pages (light by default). */
export default function HackathonLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HackathonThemeBoot />
      <HackathonThemeShell>{children}</HackathonThemeShell>
    </>
  );
}
