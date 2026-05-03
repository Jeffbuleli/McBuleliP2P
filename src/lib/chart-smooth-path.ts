/** Catmull-Rom style smooth path through points (chart coordinates). */
export function pointsToSmoothPath(
  points: { x: number; y: number }[],
  width: number,
  height: number,
): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${clamp(cp1x, 0, width)} ${clamp(cp1y, 0, height)}, ${clamp(cp2x, 0, width)} ${clamp(cp2y, 0, height)}, ${p2.x} ${p2.y}`;
  }

  return d;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Map price series to x/y with padding; y inverted (SVG origin top-left). */
export function normalizeSeries(
  prices: number[],
  width: number,
  height: number,
  pad = 8,
): { x: number; y: number }[] {
  if (prices.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const p of prices) {
    if (p < min) min = p;
    if (p > max) max = p;
  }
  const span = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return prices.map((p, i) => ({
    x: pad + (innerW * i) / Math.max(1, prices.length - 1),
    y: pad + innerH * (1 - (p - min) / span),
  }));
}
