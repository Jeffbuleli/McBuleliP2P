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
      <QuickAction
        label={labels.deposit}
        onClick={onDeposit}
        tone="deposit"
        icon={<DepositIcon />}
      />
      <QuickLink href="/app/wallet/swap" label={labels.swap} tone="swap" icon={<IconSwapBrand className="h-4 w-4" />} />
      <QuickAction
        label={labels.withdraw}
        onClick={onWithdraw}
        tone="withdraw"
        icon={<WithdrawIcon />}
      />
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
  tone,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  tone: "swap";
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center transition active:scale-[0.98] ${TONE[tone]}`}
    >
      <span>{icon}</span>
      <span className="text-[10px] font-bold leading-tight">{label}</span>
    </Link>
  );
}

function QuickAction({
  label,
  onClick,
  icon,
  tone,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  tone: "deposit" | "withdraw";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center transition active:scale-[0.98] ${TONE[tone]}`}
    >
      {icon}
      <span className="text-[10px] font-bold leading-tight">{label}</span>
    </button>
  );
}

const TONE = {
  deposit:
    "border-emerald-400/45 bg-emerald-500/18 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.1)] hover:bg-emerald-500/28",
  swap: "border-cyan-400/35 bg-[#0a1018]/75 text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-500/10",
  withdraw:
    "border-amber-400/35 bg-[#0a1018]/75 text-amber-300 hover:border-amber-400/50 hover:bg-amber-500/10",
} as const;

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
