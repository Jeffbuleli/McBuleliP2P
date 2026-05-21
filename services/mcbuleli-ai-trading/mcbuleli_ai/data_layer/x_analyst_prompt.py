"""System prompt for X (Twitter) + multi-indicator TA fusion."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

X_ANALYST_SYSTEM_PROMPT = """You are the senior crypto futures analyst for McBuleli AI. You fuse:
1) Rule-based technical context (RSI, EMA, SMA200, Ichimoku, MACD, Fib, ATR, order book, funding, multi-timeframe confirmation)
2) Headline + X (Twitter) narrative

Your JSON drives a production bot. Be precise, conservative on conflicts, aggressive only when TA and X align.

Decision hierarchy:
- If technical_score and X strongly disagree → lower confidence, prefer monitor/no_action, do NOT invent conviction.
- If higher TF does not confirm entry TF → do not recommend strong long/short (recommended_direction none or monitor).
- Regime TREND_DOWN + bullish X only → cap confidence ≤ 55 unless reversal evidence on X.
- Regime TREND_UP + bearish X only → same.
- SHOCK / volatile → position_action monitor unless close is urgent (≥75% confidence opposing open side).

Position management (open perp):
- close_now: confidence ≥ 75 AND X sentiment clearly opposes open side AND TA does not strongly support holding.
- close_and_reverse: confidence ≥ 85 AND reversal very strong; set new_direction to opposite side.
- Otherwise monitor or no_action.

New entries (recommended_direction):
- long | short | none — only when TA context + X agree in direction; none if mixed signals.
- Your output adjusts McBuleli combined_score via sentiment; extreme wrong calls hurt real users.

Output strict JSON only (no markdown):
{
  "coins": ["BTC"],
  "sentiment": "bullish",
  "confidence": 72,
  "signals": ["ETF inflow narrative", "whale accumulation mentions"],
  "ta_alignment": "aligned",
  "position_action": "monitor",
  "reason": "One concise sentence citing TA + X",
  "recommended_direction": "long",
  "new_direction": null
}

ta_alignment: "aligned" | "mixed" | "against_ta"
position_action: close_now | close_and_reverse | monitor | no_action
recommended_direction: long | short | none
new_direction: only for close_and_reverse (long | short)
sentiment: bullish | bearish | neutral | volatile
confidence: 0-100 integer
"""


@dataclass
class XPositionContext:
    symbol: str
    bot_side: Optional[str] = None
    has_open_position: bool = False
    open_side: Optional[str] = None


def build_x_analyst_user_message(
    posts: List[str],
    *,
    symbol: str,
    timeframe: str = "15m",
    confirm_timeframe: str = "1h",
    position: Optional[XPositionContext] = None,
    market_context: Optional[str] = None,
) -> str:
    base = symbol.replace("/", " ").replace(":USDT", "").strip() or "BTC"
    lines: List[str] = []

    if market_context:
        lines.append(market_context)
        lines.append("")

    lines.extend(
        [
            f"Symbol: {base} ({symbol})",
            f"Configured bot side for new entries: {(position.bot_side if position else None) or 'not set'}",
            f"TA timeframes in app: {timeframe} (entry), {confirm_timeframe} (confirm)",
        ]
    )

    pos = position or XPositionContext(symbol=symbol)
    if pos.has_open_position and pos.open_side:
        lines.append(
            f"OPEN POSITION: {pos.open_side} perp — prioritize risk; close early if X+TA oppose this side."
        )
    elif pos.bot_side:
        lines.append(
            f"Bot configured for {pos.bot_side} entries; no confirmed open position on exchange."
        )
    else:
        lines.append("No open position — entry bias only.")

    lines.extend(["", f"X posts ({len(posts)}):"])
    for i, text in enumerate(posts[:40], start=1):
        lines.append(f"{i}. {text}")
    if not posts:
        lines.append(
            "(no posts — neutral sentiment, confidence ≤ 30, ta_alignment mixed, "
            "position_action no_action, recommended_direction none)"
        )
    lines.append("")
    lines.append("Respond with one JSON object only.")
    return "\n".join(lines)
