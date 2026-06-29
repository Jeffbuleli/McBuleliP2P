import type { ReactNode } from "react";

/** Light wallet shell - futuristic HUD inside app shell. */
export default function WalletLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wallet-theme wallet-scroll -mx-4 min-h-[calc(100dvh-6.5rem)] app-scrollbar">
      {children}
    </div>
  );
}
