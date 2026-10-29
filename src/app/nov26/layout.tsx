import type { ReactNode } from "react";
import { HackathonThemeBoot } from "@/components/hackathon/hackathon-theme-boot";
import { HackathonThemeShell } from "@/components/hackathon/hackathon-theme-shell";

export default function Nov26Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <HackathonThemeBoot />
      <HackathonThemeShell>{children}</HackathonThemeShell>
    </>
  );
}
