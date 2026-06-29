import Link from "next/link";
import type { ReactNode } from "react";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import type { HudCornerTone } from "@/components/ui/hud-corners";

export function WalletSubpageHeader({
  title,
  subtitle,
  backHref = "/app/wallet",
  action,
  step,
  totalSteps = 0,
  badge,
  cornerTone,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
  step?: number;
  totalSteps?: number;
  badge?: ReactNode;
  cornerTone?: HudCornerTone;
}) {
  const showSteps = step != null && totalSteps > 0;
  const headerAccent =
    cornerTone === "buy"
      ? "green"
      : cornerTone === "sell"
        ? "amber"
        : "cyan";

  return (
    <HudFrame accent={headerAccent} cornerTone={cornerTone} className={`${HUD_PANEL_LG} mb-4 overflow-hidden`}>
      <header>
        <div className="flex items-start justify-between gap-2 border-b border-white/8 px-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Link
              href={backHref}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-300 transition active:scale-95"
              aria-label="Back"
            >
              <ChevronLeft />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-cyan-100 sm:text-lg">{title}</h1>
                {badge}
              </div>
              {subtitle ? (
                <p className="mt-0.5 text-[11px] font-medium text-[color:var(--fd-muted)]">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {action}
        </div>
        {showSteps ? (
          <div className="flex items-center justify-center gap-2 px-3 py-2.5" aria-label={subtitle}>
            {Array.from({ length: totalSteps }, (_, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-all ${
                    active
                      ? "w-7 bg-cyan-400"
                      : done
                        ? "w-1.5 bg-cyan-400/45"
                        : "w-1.5 bg-white/15"
                  }`}
                  aria-hidden
                />
              );
            })}
          </div>
        ) : null}
      </header>
    </HudFrame>
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
