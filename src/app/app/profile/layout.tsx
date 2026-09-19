import type { ReactNode } from "react";

/** Same gutters as Home — no negative bleed. */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="profile-theme profile-scroll min-h-[calc(100dvh-6.5rem)] pb-4">
      {children}
    </div>
  );
}
