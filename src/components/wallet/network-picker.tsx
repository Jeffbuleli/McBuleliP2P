"use client";

import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";

const BADGE_DARK: Record<NetworkId, string> = {
  TRC20: "border border-emerald-400/35 bg-emerald-500/20 text-emerald-300",
  ERC20: "border border-sky-400/35 bg-sky-500/20 text-sky-300",
  BEP20: "border border-amber-400/35 bg-amber-500/20 text-amber-300",
};

export function NetworkPicker({
  value,
  onChange,
  label,
}: {
  value: NetworkId;
  onChange: (id: NetworkId) => void;
  label?: string;
}) {
  const ids = Object.keys(USDT_NETWORKS) as NetworkId[];

  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-400/80">
          {label}
        </p>
      ) : null}
      <div
        className="flex flex-col gap-2"
        role="radiogroup"
        aria-label={label ?? "Network"}
      >
        {ids.map((id) => {
          const s = USDT_NETWORKS[id];
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(id)}
              className={`flex min-h-[56px] touch-manipulation items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                active
                  ? "border-emerald-400/45 bg-emerald-500/12 shadow-[0_0_16px_rgba(52,211,153,0.08)]"
                  : "border-white/10 bg-[#0a1018]/85 hover:border-white/18"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    active
                      ? "border-emerald-400 bg-emerald-500/80 text-white"
                      : "border-white/20 bg-[#050810]"
                  }`}
                  aria-hidden
                >
                  {active ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12l5 5L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="text-sm font-bold text-[color:var(--fd-text)]">{s.label}</span>
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${BADGE_DARK[id]}`}>
                {id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
