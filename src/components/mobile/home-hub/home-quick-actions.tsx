"use client";

import Link from "next/link";
import { useState } from "react";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import { WalletMoneySheet } from "@/components/wallet/wallet-money-sheet";

type Action = {
  id: string;
  href?: string;
  sheet?: "deposit";
  labelFr: string;
  labelEn: string;
  accent?: boolean;
  live?: boolean;
};

const ACTIONS: Action[] = [
  { id: "deposit", sheet: "deposit", labelFr: "Dépôt", labelEn: "Deposit", accent: true },
  { href: "/app/p2p", id: "p2p", labelFr: "P2P", labelEn: "P2P" },
  { href: "/app/trade", id: "trade", labelFr: "Trade", labelEn: "Trade" },
  { href: "/app/community", id: "community", labelFr: "Communauté", labelEn: "Community" },
  { href: "/app/community/formations", id: "lives", labelFr: "Lives", labelEn: "Live" },
  { href: "/app/community/signals", id: "signals", labelFr: "Signaux", labelEn: "Signals" },
];

const ICON_TONE: Record<string, string> = {
  deposit: "text-emerald-400",
  p2p: "text-cyan-400",
  trade: "text-amber-400",
  community: "text-fuchsia-400",
  lives: "text-violet-400",
  signals: "text-sky-400",
};

export function HomeQuickActions({
  fr,
  liveActive,
}: {
  fr: boolean;
  liveActive?: boolean;
}) {
  const [depositOpen, setDepositOpen] = useState(false);

  return (
    <div>
      <HudFrame accent="green" className={`${HUD_PANEL_LG} p-3`}>
        <section aria-label={fr ? "Actions rapides" : "Quick actions"}>
          <h2 className="mb-2 px-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400/80">
            {fr ? "Actions rapides" : "Quick actions"}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {ACTIONS.map((action) => {
              const isLiveTile = action.id === "lives" && liveActive;
              const label = fr ? action.labelFr : action.labelEn;
              const tileClass = `relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-center transition active:scale-[0.98] ${
                action.accent
                  ? "border-emerald-400/45 bg-emerald-500/12"
                  : isLiveTile
                    ? "border-rose-500/35 bg-rose-500/10"
                    : "border-white/10 bg-[#0a1018]/70 hover:border-white/20"
              }`;

              if (action.sheet === "deposit") {
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setDepositOpen(true)}
                    className={tileClass}
                  >
                    <ActionIcon actionId={action.id} accent={action.accent} live={isLiveTile} />
                    <span
                      className={`text-[11px] font-extrabold leading-tight ${
                        action.accent ? "text-emerald-300" : "text-[color:var(--fd-text)]"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              }

              return (
                <Link key={action.id} href={action.href!} className={tileClass}>
                  {isLiveTile ? (
                    <span
                      className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#050810]"
                      aria-hidden
                    />
                  ) : null}
                  <ActionIcon actionId={action.id} accent={action.accent} live={isLiveTile} />
                  <span
                    className={`text-[11px] font-extrabold leading-tight ${
                      action.accent
                        ? "text-emerald-300"
                        : isLiveTile
                          ? "text-rose-300"
                          : "text-[color:var(--fd-text)]"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </HudFrame>

      <WalletMoneySheet open={depositOpen} mode="deposit" onClose={() => setDepositOpen(false)} />
    </div>
  );
}

function ActionIcon({
  actionId,
  accent,
  live,
}: {
  actionId: string;
  accent?: boolean;
  live?: boolean;
}) {
  const cls = accent
    ? "text-emerald-400"
    : live
      ? "text-rose-400"
      : ICON_TONE[actionId] ?? "text-cyan-400";

  if (actionId === "deposit") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <path d="M12 4v12M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (actionId === "p2p") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <path d="M7 16V4L3 8m4-4 4 4M17 8v12l4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (actionId === "trade") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <path d="M4 18l4-8 4 4 4-10 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (actionId === "community") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (actionId === "lives") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <rect x="2" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <path d="M16 8l6-3v10l-6-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
      <path d="M4 18l4-8 4 4 4-10 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
