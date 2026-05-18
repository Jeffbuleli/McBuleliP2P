import type { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="profile-theme -mx-4 -mt-3 min-h-[60dvh] rounded-t-3xl bg-[var(--fd-bg)] px-4 pb-2 pt-4">
      {children}
    </div>
  );
}
