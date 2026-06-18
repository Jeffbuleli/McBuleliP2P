import type { ReactNode } from "react";

export function WalletFormCard({ children }: { children: ReactNode }) {
  return <div className="wallet-form-card grid gap-3">{children}</div>;
}

export function WalletFieldLabel({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="wallet-field-label">
      <span className="wallet-field-label-text">{label}</span>
      {children}
    </label>
  );
}

export const walletInputClass =
  "wallet-input mt-1 w-full rounded-xl border px-3 py-3 text-sm tabular-nums";

export const walletPrimaryBtnClass =
  "wallet-btn-primary w-full rounded-2xl py-3 text-sm font-bold disabled:opacity-45";

export const walletGhostBtnClass =
  "wallet-btn-ghost rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-45";

export function WalletStatusBanner({
  tone,
  children,
}: {
  tone: "info" | "success" | "warn" | "error";
  children: ReactNode;
}) {
  return <div className={`wallet-status-banner wallet-status-banner-${tone}`}>{children}</div>;
}

export function WalletErrorBanner({ children }: { children: ReactNode }) {
  return <WalletStatusBanner tone="error">{children}</WalletStatusBanner>;
}
