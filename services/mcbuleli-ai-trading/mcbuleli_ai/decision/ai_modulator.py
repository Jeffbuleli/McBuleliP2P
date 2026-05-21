"""AI/sentiment modulator — does not veto strong technical setups."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional

from mcbuleli_ai.data_layer.news_data import NewsBundle

MACRO_RE = re.compile(
    r"\b(cpi|fomc|crash|hack|exploit|liquidation\s+cascade|chapter\s+11)\b",
    re.I,
)


@dataclass
class AiModulatorResult:
    sentiment: str
    confidence: float
    risk_modifier: float
    leverage_modifier: float
    warning_level: str
    ai_notes: List[str]
    blocking_event: bool


def evaluate_ai_modulator(
    news: NewsBundle,
    technical_score: int,
    *,
    min_technical_override: int = 35,
) -> AiModulatorResult:
    notes: List[str] = []
    text = " ".join(
        [news.sentiment.x_reason or ""]
        + (getattr(news.sentiment, "top_themes", None) or [])
    )
    conf = float(news.sentiment.x_confidence or 0)
    blocking = bool(MACRO_RE.search(text) and conf >= 80)
    tech_strong = abs(technical_score) >= min_technical_override

    if blocking:
        return AiModulatorResult(
            sentiment=news.sentiment.x_sentiment or "neutral",
            confidence=conf,
            risk_modifier=-0.5,
            leverage_modifier=0.4,
            warning_level="HIGH",
            ai_notes=["blocking_event"],
            blocking_event=True,
        )

    sentiment = (news.sentiment.x_sentiment or "neutral").lower()
    lev_mod = 1.0
    risk_mod = 0.0
    warning = "LOW"

    if news.sentiment.x_llm_used and sentiment == "bearish" and technical_score > 0:
        if tech_strong:
            lev_mod = 0.75
            risk_mod = -0.12
            warning = "MEDIUM"
            notes.append("mild_bearish_x_technical_strong")
        else:
            lev_mod = 0.6
            risk_mod = -0.2
            warning = "MEDIUM"
    elif news.sentiment.x_llm_used and sentiment == "bullish" and technical_score < 0:
        if tech_strong:
            lev_mod = 0.75
            risk_mod = -0.12
            warning = "MEDIUM"
        else:
            lev_mod = 0.6
            risk_mod = -0.2
            warning = "MEDIUM"

    return AiModulatorResult(
        sentiment=sentiment,
        confidence=conf,
        risk_modifier=risk_mod,
        leverage_modifier=max(0.35, min(1.15, lev_mod)),
        warning_level=warning,
        ai_notes=notes,
        blocking_event=False,
    )
