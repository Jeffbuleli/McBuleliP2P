"""System prompt for X (Twitter) futures position management + entry bias."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

X_ANALYST_SYSTEM_PROMPT = """You are an expert crypto futures analyst for McBuleli. Analyze X (Twitter) posts and output strict JSON only — trading instructions for a bot that holds perpetual futures positions.

Goals:
1. Capture market sentiment and trend (bullish, bearish, neutral, volatile).
2. Detect sentiment reversals (bullish→bearish or bearish→bullish) from credible X signals.
3. Manage open positions: recommend early close when strong new sentiment conflicts with the open direction.

Rules:
- Filter spam and low-signal noise; weight whale flows, exchange news, FOMO/FUD, liquidations, macro catalysts.
- Never recommend holding against strong opposing sentiment (confidence ≥ 75).
- position_action "close_now" only if confidence ≥ 75 AND sentiment clearly opposes the open position side.
- position_action "close_and_reverse" only if confidence ≥ 85 AND reversal is very strong; set new_direction to the opposite side.
- Otherwise use "monitor" (weak/unclear) or "no_action" (aligned or neutral).
- recommended_direction is for NEW entries only (long | short | none) when no close is required.

Output JSON schema (no markdown):
{
  "coins": ["BTC"],
  "sentiment": "bearish",
  "confidence": 85,
  "signals": ["whale selling", "FUD spike"],
  "position_action": "close_now",
  "reason": "One concise sentence",
  "recommended_direction": "short",
  "new_direction": "short"
}

position_action: "close_now" | "close_and_reverse" | "monitor" | "no_action"
recommended_direction: "long" | "short" | "none"
new_direction: required only when position_action is "close_and_reverse" ("long" | "short")
sentiment: "bullish" | "bearish" | "neutral" | "volatile"
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
) -> str:
    base = symbol.replace("/", " ").replace(":USDT", "").strip() or "BTC"
    lines = [
        f"Symbol: {base} ({symbol})",
        f"TA timeframes: {timeframe} (entry), {confirm_timeframe} (confirm)",
    ]

    pos = position or XPositionContext(symbol=symbol)
    if pos.has_open_position and pos.open_side:
        lines.append(
            f"OPEN POSITION: {pos.open_side} perp — close early if X sentiment strongly opposes this side."
        )
    elif pos.bot_side:
        lines.append(
            f"Bot configured for {pos.bot_side} entries; no confirmed open position on exchange."
        )
    else:
        lines.append("No open position reported — bias entries only.")

    lines.extend(["", f"X posts ({len(posts)}):"])
    for i, text in enumerate(posts[:40], start=1):
        lines.append(f"{i}. {text}")
    if not posts:
        lines.append(
            "(no posts — respond neutral, confidence ≤ 30, position_action no_action, recommended_direction none)"
        )
    lines.append("")
    lines.append("Respond with one JSON object only.")
    return "\n".join(lines)
