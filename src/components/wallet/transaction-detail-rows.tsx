"use client";

import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";

export function TransactionDetailRows({
  rows,
}: {
  rows: { label: string; value: string; mono?: boolean }[];
}) {
  return (
    <HudFrame accent="green" className={`${HUD_PANEL_LG} mt-3`}>
      <div className="space-y-0 p-4 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between gap-3 border-b border-white/8 py-2.5 last:border-0"
          >
            <span className="shrink-0 text-[color:var(--fd-muted)]">{row.label}</span>
            <span
              className={`max-w-[62%] text-right font-semibold text-[color:var(--fd-text)] ${
                row.mono ? "break-all font-mono text-xs" : ""
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </HudFrame>
  );
}
