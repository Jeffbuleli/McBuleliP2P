"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type WalletActionTone = "deposit" | "send" | "withdraw" | "swap";

const CHIP: Record<WalletActionTone, string> = {
  deposit:
    "border-amber-400/40 bg-amber-500/10 hover:border-amber-400/55 hover:bg-amber-500/16",
  send: "border-cyan-400/35 bg-cyan-500/8 hover:border-cyan-400/50 hover:bg-cyan-500/12",
  withdraw:
    "border-emerald-400/40 bg-emerald-500/10 hover:border-emerald-400/55 hover:bg-emerald-500/16",
  swap: "border-cyan-400/35 bg-[#0a1018]/80 hover:border-cyan-400/50 hover:bg-cyan-500/10",
};

const ICON: Record<WalletActionTone, string> = {
  deposit:
    "border border-amber-400/50 bg-amber-500/20 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.14)]",
  send: "border border-cyan-400/45 bg-cyan-500/15 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.12)]",
  withdraw:
    "border border-emerald-400/45 bg-emerald-500/15 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.12)]",
  swap: "border border-cyan-400/40 bg-cyan-500/12 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.1)]",
};

const LABEL: Record<WalletActionTone, string> = {
  deposit: "text-amber-200",
  send: "text-cyan-200",
  withdraw: "text-emerald-200",
  swap: "text-cyan-200",
};

export function WalletAssetActionChip({
  href,
  label,
  icon,
  tone,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  tone: WalletActionTone;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 transition active:scale-[0.97] ${CHIP[tone]}`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full ${ICON[tone]}`}
      >
        {icon}
      </span>
      <span className={`max-w-[4.5rem] truncate text-center text-[10px] font-bold leading-tight ${LABEL[tone]}`}>
        {label}
      </span>
    </Link>
  );
}

export function WalletAssetActionRow({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="mt-4 flex gap-2">{children}</div>;
}
