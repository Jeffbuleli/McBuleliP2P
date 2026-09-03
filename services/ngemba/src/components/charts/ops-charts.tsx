"use client";

export type DonutSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function UrgencyDonut({
  slices,
  centerLabel,
  centerValue,
  size = 140,
}: {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string | number;
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const stroke = size * 0.12;

  let angle = 0;
  const arcs =
    total <= 0
      ? []
      : slices
          .filter((s) => s.value > 0)
          .map((s) => {
            const sweep = (s.value / total) * 360;
            const start = angle;
            const end = angle + Math.max(sweep, 0.01);
            angle = end;
            return { ...s, start, end };
          });

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        role="img"
        aria-label={centerLabel}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--ng-primary-muted)"
          strokeWidth={stroke}
        />
        {arcs.map((a) => (
          <path
            key={a.id}
            d={arcPath(cx, cy, r, a.start, a.end)}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-[var(--ng-text)]"
          style={{ fontSize: 18, fontWeight: 700 }}
        >
          {centerValue}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-[var(--ng-muted)]"
          style={{ fontSize: 9, fontWeight: 600 }}
        >
          {centerLabel}
        </text>
      </svg>
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[11px] sm:flex-col sm:justify-start">
        {slices.map((s) => (
          <li key={s.id} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="font-medium text-ng-muted">{s.label}</span>
            <span className="font-bold text-ng-text">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SlaBar({
  ok,
  breached,
  okLabel = "OK",
  breachedLabel = "Dépassés",
}: {
  ok: number;
  breached: number;
  okLabel?: string;
  breachedLabel?: string;
}) {
  const total = Math.max(ok + breached, 1);
  const okPct = (ok / total) * 100;
  const breachedPct = (breached / total) * 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-ng-primary">
          {okLabel} {ok}
        </span>
        <span className="text-ng-urgent">
          {breachedLabel} {breached}
        </span>
      </div>
      <svg viewBox="0 0 200 12" className="h-3 w-full" role="img" aria-label="SLA">
        <rect x="0" y="0" width="200" height="12" rx="6" fill="var(--ng-primary-muted)" />
        <rect
          x="0"
          y="0"
          width={Math.max(0, (okPct / 100) * 200)}
          height="12"
          rx="6"
          fill="var(--ng-primary)"
        />
        <rect
          x={(okPct / 100) * 200}
          y="0"
          width={Math.max(0, (breachedPct / 100) * 200)}
          height="12"
          rx="6"
          fill="var(--ng-urgent)"
        />
      </svg>
    </div>
  );
}

export function CategoryBars({
  items,
  maxItems = 8,
}: {
  items: Array<{ id: string; label: string; count: number }>;
  maxItems?: number;
}) {
  const rows = items.slice(0, maxItems);
  const max = Math.max(...rows.map((r) => r.count), 1);

  if (rows.length === 0) {
    return <p className="text-sm text-ng-muted">Pas encore de données.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const w = Math.max(4, (row.count / max) * 100);
        return (
          <li key={row.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-ng-text">{row.label}</span>
              <span className="shrink-0 font-bold text-ng-primary">{row.count}</span>
            </div>
            <svg viewBox="0 0 100 6" className="h-1.5 w-full" aria-hidden>
              <rect x="0" y="0" width="100" height="6" rx="3" fill="var(--ng-primary-muted)" />
              <rect
                x="0"
                y="0"
                width={w}
                height="6"
                rx="3"
                fill="var(--ng-primary)"
              />
            </svg>
          </li>
        );
      })}
    </ul>
  );
}

export function DaySparkline({
  days,
  height = 96,
}: {
  days: Array<{ day: string; count: number }>;
  height?: number;
}) {
  const points = days.slice(-30);
  if (points.length === 0) {
    return <p className="text-sm text-ng-muted">Pas encore de données.</p>;
  }

  const max = Math.max(...points.map((p) => p.count), 1);
  const w = 280;
  const h = height;
  const padX = 4;
  const padY = 8;
  const step =
    points.length <= 1 ? 0 : (w - padX * 2) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = padX + i * step;
    const y = h - padY - (p.count / max) * (h - padY * 2);
    return { x, y, ...p };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${coords[coords.length - 1]!.x.toFixed(1)} ${h - padY} L ${coords[0]!.x.toFixed(1)} ${h - padY} Z`;

  const last = coords[coords.length - 1]!;
  const first = coords[0]!;

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-24 w-full"
        role="img"
        aria-label="Alertes par jour"
      >
        <path d={area} fill="var(--ng-primary-muted)" opacity="0.85" />
        <path
          d={line}
          fill="none"
          stroke="var(--ng-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c) => (
          <circle
            key={c.day}
            cx={c.x}
            cy={c.y}
            r={points.length > 20 ? 1.5 : 2.5}
            fill="var(--ng-primary)"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-ng-muted">
        <span>{first.day}</span>
        <span>
          {last.count} - {last.day}
        </span>
      </div>
    </div>
  );
}
