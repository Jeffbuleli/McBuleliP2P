import type { ReactNode } from "react";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="profile-theme profile-scroll -mx-4 min-h-[calc(100dvh-6.5rem)] pb-4">
      {children}
    </div>
  );
}
