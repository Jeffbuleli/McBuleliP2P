import type { ReactNode } from "react";
import { HackathonThemeBoot } from "@/components/hackathon/hackathon-theme-boot";
import { HackathonThemeShell } from "@/components/hackathon/hackathon-theme-shell";

/** Même shell visuel que /nov26 (sans imposer le layout /hackathon Kinshasa). */
export default function HackathonNov26Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <HackathonThemeBoot />
      <HackathonThemeShell>{children}</HackathonThemeShell>
    </>
  );
}
