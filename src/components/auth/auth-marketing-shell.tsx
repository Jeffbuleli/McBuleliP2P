"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function AuthMarketingShell({
  title,
  eyebrow,
  backLabel,
  children,
  footer,
}: {
  title: string;
  eyebrow?: string;
  backLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(16,185,129,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-700/70 bg-stone-950/70 text-stone-200 shadow-sm backdrop-blur-md transition hover:border-emerald-700/40 hover:text-white active:scale-[0.99]"
            aria-label={backLabel}
            title={backLabel}
          >
            <BackIcon className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-emerald-900/10 dark:bg-stone-900 dark:ring-white/10">
              <Image src="/brand/logo.png" alt="" width={30} height={30} priority />
            </div>
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400/90">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="truncate text-2xl font-bold tracking-tight text-stone-50">{title}</h1>
            </div>
          </div>
        </div>

        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </div>
  );
}
