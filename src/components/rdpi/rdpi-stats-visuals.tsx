"use client";

/** Cyber Alert-inspired SVG stats for RDPI dashboard — varied forms, one palette. */

export const RDPI_CHART = {
  blue: "#1E5EFF",
  gold: "#E8B923",
  ink: "#0A0A0A",
  soft: "#4C7DFF",
  muted: "#64748B",
  light: "#93A8FF",
  paper: "#F3F1EA",
  track: "#E8E6DF",
} as const;

export const RDPI_SERIES = [
  RDPI_CHART.blue,
  RDPI_CHART.gold,
  RDPI_CHART.ink,
  RDPI_CHART.soft,
  "#C9A227",
  RDPI_CHART.muted,
  RDPI_CHART.light,
] as const;

export function RdpiStatTile({
  label,
  value,
  hint,
  color = RDPI_CHART.blue,
  maxHint = 20,
}: {
  label: string;
  value: string | number;
  hint?: string;
  color?: string;
  maxHint?: number;
}) {
  const n = typeof value === "number" ? value : 0;
  const pct =
    typeof value === "number"
      ? Math.min(100, n === 0 ? 8 : 18 + Math.min(n, maxHint) * 4)
      : 42;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[#E5E5E0] bg-white/90 p-4 shadow-[0_14px_36px_-28px_rgba(34,34,34,0.45)]">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#78716c]">
          {label}
        </p>
        <span
          className="mt-0.5 h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.75)]"
          style={{ background: color }}
        />
      </div>
      <p className="mt-3 font-[family-name:var(--font-rdpi-display)] text-3xl font-semibold tracking-tight text-[#0c0a09]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] font-medium text-[#a8a29e]">{hint}</p> : null}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#F0EEE7]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Vertical histogram columns (Cyber Alert severity bars). */
export function RdpiVerticalBars({
  title,
  totalLabel,
  buckets,
}: {
  title?: string;
  totalLabel?: string;
  buckets: { label: string; count: number; color?: string }[];
}) {
  if (buckets.length === 0) {
    return <p className="text-sm text-[#a8a29e]">Pas encore de données.</p>;
  }
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div>
      {title || totalLabel ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title ? (
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--rdpi-blue)]">
              {title}
            </p>
          ) : (
            <span />
          )}
          {totalLabel ? (
            <span className="text-[11px] font-semibold text-[#78716c]">
              {totalLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex h-40 items-end gap-2 sm:gap-3">
        {buckets.map((b, i) => {
          const h = b.count === 0 ? 10 : Math.max(18, Math.round((b.count / max) * 100));
          const color = b.color ?? RDPI_SERIES[i % RDPI_SERIES.length];
          return (
            <div key={b.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-extrabold tabular-nums text-[#0c0a09]">
                {b.count}
              </span>
              <div className="relative flex h-28 w-full items-end justify-center rounded-2xl bg-[#F3F1EA]/80 px-1 pb-1.5 sm:px-1.5">
                <div
                  className="w-full max-w-[44px] rounded-xl shadow-[0_10px_24px_-14px_rgba(12,24,48,0.4)] transition-all duration-700"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(180deg, ${color} 0%, #0b1020 160%)`,
                  }}
                  title={`${b.label}: ${b.count}`}
                />
              </div>
              <span className="max-w-full truncate text-center text-[10px] font-bold tracking-wide text-[#78716c]">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Score ring with radar frame (Cyber Alert RiskRadar simplified). */
export function RdpiScoreRing({
  value,
  max = 100,
  label,
  color = RDPI_CHART.blue,
}: {
  value: number;
  max?: number;
  label: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const r = 48;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={color}
          strokeOpacity="0.16"
          strokeDasharray="3 7"
          strokeWidth="1.25"
        />
        <circle cx="100" cy="100" r="80" fill="none" stroke={color} strokeOpacity="0.08" />
        <g stroke={color} strokeOpacity="0.2" strokeWidth="1.25">
          <path d="M22 56h16M22 56v16M178 56h-16M178 56v16M22 144h16M22 144v-16M178 144h-16M178 144v-16" />
        </g>
      </svg>
      <svg viewBox="0 0 120 120" className="absolute inset-[18%] -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke={RDPI_CHART.track} strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tracking-tight" style={{ color }}>
          {pct}%
        </span>
        <span className="mt-0.5 max-w-[5.5rem] text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[#78716c]">
          {label}
        </span>
      </div>
    </div>
  );
}

/** Semi gauge for Likert / intensity averages. */
export function RdpiGauge({
  value,
  max = 5,
  label,
  color = RDPI_CHART.gold,
}: {
  value: number;
  max?: number;
  label: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const arc = 119;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 56" className="w-full max-w-[160px]" aria-hidden>
        <path
          d="M 12 50 A 38 38 0 0 1 88 50"
          fill="none"
          stroke={RDPI_CHART.track}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 12 50 A 38 38 0 0 1 88 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${pct * arc} ${arc}`}
        />
        <text
          x="50"
          y="42"
          textAnchor="middle"
          className="fill-[#0c0a09] text-[14px] font-extrabold"
        >
          {value.toFixed(1)}
        </text>
      </svg>
      <p className="mt-1 max-w-[11rem] text-center text-[11px] font-semibold text-[#78716c]">
        {label}
      </p>
    </div>
  );
}

/** Donut with legend — keep for binary Oui/Non. */
export function RdpiDonutLegend({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[#a8a29e]">Pas encore de données.</p>;
  }
  const total = items.reduce((s, x) => s + x.value, 0) || 1;
  const size = 112;
  const r = (size - 14) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="shrink-0 rounded-2xl border border-[#E5E5E0] bg-white p-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={c} cy={c} r={r} fill="none" stroke={RDPI_CHART.track} strokeWidth="10" />
          {items.map((it, i) => {
            const dash = (it.value / total) * circ;
            const el = (
              <circle
                key={it.label}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={RDPI_SERIES[i % RDPI_SERIES.length]}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${c} ${c})`}
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {items.map((it, i) => (
          <li
            key={it.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E5E0] bg-white px-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: RDPI_SERIES[i % RDPI_SERIES.length] }}
              />
              <span className="truncate font-medium text-[#1c1917]">{it.label}</span>
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-[#78716c]">
              {it.value} - {Math.round((it.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RdpiHorizontalBars({
  items,
  color = RDPI_CHART.blue,
  valueDecimals = 0,
  invertFill = false,
}: {
  items: { label: string; value: number; max: number; color?: string }[];
  color?: string;
  valueDecimals?: number;
  /** When true, lower values fill more of the bar (rank / priority). */
  invertFill?: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[#a8a29e]">Pas encore de données.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((it) => {
        const barColor = it.color ?? color;
        const ratio =
          it.max > 0
            ? invertFill
              ? Math.max(0, (it.max - it.value) / it.max)
              : it.value / it.max
            : 0;
        return (
          <li key={it.label}>
            <div className="mb-1 flex justify-between gap-2 text-[11px]">
              <span className="truncate font-semibold text-[#1c1917]">{it.label}</span>
              <span className="shrink-0 font-mono tabular-nums" style={{ color: barColor }}>
                {it.value.toFixed(valueDecimals)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#F0EEE7]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${ratio * 100}%`,
                  background: barColor,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
