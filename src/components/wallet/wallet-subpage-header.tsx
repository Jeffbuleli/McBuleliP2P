import Link from "next/link";
import type { ReactNode } from "react";

export function WalletSubpageHeader({
  title,
  subtitle,
  backHref = "/app/wallet",
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link
          href={backHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-primary)] shadow-sm active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-[color:var(--fd-text)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[color:var(--fd-muted)]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
