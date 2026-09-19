import type { ReactNode } from "react";

/** Light wallet shell — same gutters as Home (no negative bleed). */
export default function WalletLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wallet-theme wallet-scroll min-h-[calc(100dvh-6.5rem)] pb-4">
      {children}
    </div>
  );
}
