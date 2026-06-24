"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconSwapBrand } from "@/components/wallet/icon-swap-brand";

export type WalletQuickLinkLabels = {
  deposit: string;
  swap: string;
  withdraw: string;
};

export function WalletQuickLinks({
  labels,
  onDeposit,
  onWithdraw,
}: {
  labels: WalletQuickLinkLabels;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <QuickAction label={labels.deposit} onClick={onDeposit} accent icon={<DepositIcon />} />
      <QuickLink href="/app/wallet/swap" label={labels.swap} icon={<IconSwapBrand className="h-4 w-4" />} />
      <QuickAction label={labels.withdraw} onClick={onWithdraw} icon={<WithdrawIcon />} />
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border border-[color:var(--fd-border)] bg-white px-1 py-2 text-center active:scale-[0.98] active:bg-[color:var(--fd-mint)]/50"
    >
      <span className="text-[color:var(--fd-primary)]">{icon}</span>
      <span className="text-[10px] font-bold leading-tight text-[color:var(--fd-text)]">{label}</span>
    </Link>
  );
}

function QuickAction({
  label,
  onClick,
  icon,
  accent,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center active:scale-[0.98] ${
        accent
          ? "border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-primary)] text-white shadow-sm"
          : "border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-primary)] active:bg-[color:var(--fd-mint)]/50"
      }`}
    >
      <span className={accent ? "text-white" : "text-[color:var(--fd-primary)]"}>{icon}</span>
      <span
        className={`text-[10px] font-bold leading-tight ${accent ? "text-white" : "text-[color:var(--fd-text)]"}`}
      >
        {label}
      </span>
    </button>
  );
}

function DepositIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4v12M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WithdrawIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20V8M7 13l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
