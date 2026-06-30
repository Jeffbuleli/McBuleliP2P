/**
 * EMA smoothing for technical scores — avoids -40 → +40 jumps between ticks.
 */

const DEFAULT_ALPHA = 0.38;

export function smoothScore(
  rawScore: number,
  previousSmoothed: number | null,
  alpha = DEFAULT_ALPHA,
): number {
  if (
    previousSmoothed == null ||
    !Number.isFinite(previousSmoothed)
  ) {
    return Math.round(rawScore);
  }
  const next = alpha * rawScore + (1 - alpha) * previousSmoothed;
  return Math.round(Math.max(-100, Math.min(100, next)));
}

export function scoreToConfidence(absScore: number): number {
  return Math.round(Math.max(0, Math.min(100, absScore)));
}
