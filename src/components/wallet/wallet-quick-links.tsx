"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconSwapBrand } from "@/components/wallet/icon-swap-brand";

export type WalletQuickLinkLabels = {
  swap: string;
  send: string;
  fiat: string;
};

export function WalletQuickLinks({ labels }: { labels: WalletQuickLinkLabels }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <QuickLink href="/app/wallet/swap" label={labels.swap} icon={<IconSwapBrand className="h-4 w-4" />} />
      <QuickLink
        href="/app/wallet/transfer"
        label={labels.send}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        }
      />
      <QuickLink
        href="/app/wallet/fiat"
        label={labels.fiat}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        }
      />
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
      className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-[color:var(--fd-border)] bg-white px-1 py-2 text-center active:scale-[0.98] active:bg-[color:var(--fd-mint)]/50"
    >
      <span className="text-[color:var(--fd-primary)]">{icon}</span>
      <span className="text-[10px] font-bold leading-tight text-[color:var(--fd-text)]">{label}</span>
    </Link>
  );
}
