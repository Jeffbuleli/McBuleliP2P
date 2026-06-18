"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type WalletAction = {
  href: string;
  label: string;
  icon: ReactNode;
  tone: "deposit" | "withdraw" | "send" | "swap";
};

export function WalletActionGrid({ actions }: { actions: WalletAction[] }) {
  return (
    <div className="wallet-action-grid">
      {actions.map((a) => (
        <Link key={a.href + a.label} href={a.href} className={`wallet-action-tile wallet-action-tile-${a.tone}`}>
          <span className="wallet-action-tile-icon">{a.icon}</span>
          <span className="wallet-action-tile-label">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

export function IconDeposit({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4v12M8 12l4 4 4-4M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconWithdraw({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20V8M8 12l4-4 4 4M5 4h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSend({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSwap({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconHistory({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l2.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
