"use client";

import { useState, type ReactNode } from "react";

export function WalletServicesAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mt-4 pb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-3 text-left active:scale-[0.99]"
        aria-expanded={open}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {title}
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <ChevronDown />
        </span>
      </button>
      {open ? <div className="mt-2 flex flex-col gap-2">{children}</div> : null}
    </section>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
