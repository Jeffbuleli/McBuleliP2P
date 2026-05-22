"use client";

/** Minimal SVG charts — no external lib. */

export function AvecDonut({
  segments,
  size = 88,
}: {
  segments: { value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - 12) / 2;
  const c = size / 2;
  let offset = 0;
  const circumference = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--fd-border)" strokeWidth="8" />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const el = (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

export function AvecBarChart({
  values,
  maxHeight = 56,
}: {
  values: number[];
  maxHeight?: number;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end justify-between gap-1" style={{ height: maxHeight }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-[color:var(--fd-primary)]/80"
          style={{ height: `${Math.max(4, (v / max) * maxHeight)}px` }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

export function AvecGauge({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const angle = pct * 180;
  const rad = ((180 - angle) * Math.PI) / 180;
  const x = 50 + 40 * Math.cos(rad);
  const y = 50 - 40 * Math.sin(rad);

  return (
    <svg viewBox="0 0 100 56" className="w-full max-w-[140px]" aria-hidden>
      <path
        d="M 12 50 A 38 38 0 0 1 88 50"
        fill="none"
        stroke="var(--fd-border)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 12 50 A 38 38 0 0 1 88 50"
        fill="none"
        stroke="var(--fd-primary)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${pct * 119} 119`}
      />
      <line x1="50" y1="50" x2={x} y2={y} stroke="var(--fd-primary)" strokeWidth="2" />
      <circle cx="50" cy="50" r="4" fill="var(--fd-primary)" />
      <text x="50" y="48" textAnchor="middle" className="fill-[color:var(--fd-text)] text-[11px] font-bold">
        {label}
      </text>
    </svg>
  );
}

export function AvecHorizontalBars({
  items,
}: {
  items: { label: string; value: number; max: number }[];
}) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-0.5 flex justify-between text-[10px]">
            <span className="truncate font-semibold text-[color:var(--fd-text)]">{it.label}</span>
            <span className="font-mono tabular-nums text-[color:var(--fd-primary)]">
              {it.value.toFixed(0)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--fd-border)]">
            <div
              className="h-full rounded-full bg-[color:var(--fd-primary)]"
              style={{ width: `${it.max > 0 ? (it.value / it.max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
