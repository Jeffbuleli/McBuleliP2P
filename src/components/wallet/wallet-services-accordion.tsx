"use client";

import { useState, type ReactNode } from "react";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";

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
    <HudFrame accent="cyan" className={`${HUD_PANEL_LG} mx-4 mt-4`}>
      <section aria-label={title}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 border-0 bg-transparent px-4 py-3 text-left active:scale-[0.99]"
          aria-expanded={open}
        >
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400/80">
            {title}
          </span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/12 text-cyan-300 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <ChevronDown />
          </span>
        </button>
        {open ? <div className="flex flex-col gap-2 px-3 pb-3">{children}</div> : null}
      </section>
    </HudFrame>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
