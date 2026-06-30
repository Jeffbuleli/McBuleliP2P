"use client";

import { USDT_NETWORKS, type NetworkId } from "@/lib/networks";

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
        <p className="text-center text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
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
              className={`flex min-h-[56px] touch-manipulation items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.99] ${
                active
                  ? "border-[color:var(--fd-primary)] bg-emerald-50/90 shadow-sm ring-2 ring-[color:var(--fd-primary)]/25"
                  : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    active
                      ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-primary)] text-white"
                      : "border-stone-300 bg-white"
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
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${s.badgeClass}`}>
                {id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

