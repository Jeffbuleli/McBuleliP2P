"""Technical score smoothing — reduces tick-to-tick score jumps."""

from __future__ import annotations

from typing import Optional

DEFAULT_ALPHA = 0.38


def smooth_technical_score(
    raw: int,
    previous: Optional[int] = None,
    alpha: float = DEFAULT_ALPHA,
) -> int:
    if previous is None:
        return int(max(-100, min(100, round(raw))))
    blended = alpha * raw + (1.0 - alpha) * previous
    return int(max(-100, min(100, round(blended))))
