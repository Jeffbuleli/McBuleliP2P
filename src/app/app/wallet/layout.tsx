import type { ReactNode } from "react";

/** Light wallet shell — matches profile Fondeka polish. */
export default function WalletLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wallet-theme wallet-scroll -mx-4 min-h-[calc(100dvh-6.5rem)] pb-4">
      {children}
    </div>
  );
}
