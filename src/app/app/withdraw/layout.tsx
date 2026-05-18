import type { ReactNode } from "react";

export default function WithdrawLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wallet-theme wallet-scroll -mx-4 min-h-0 px-4 pb-4">
      {children}
    </div>
  );
}
