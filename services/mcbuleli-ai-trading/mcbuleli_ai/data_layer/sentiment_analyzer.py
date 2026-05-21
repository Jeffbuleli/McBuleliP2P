from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:
    SentimentIntensityAnalyzer = None  # type: ignore


# Crypto-specific rumor / FUD keywords (fundamental + social narrative)
BEARISH_KEYWORDS = [
    "hack",
    "exploit",
    "ban",
    "lawsuit",
    "sec",
    "crash",
    "collapse",
    "bankrupt",
    "insolvent",
    "fraud",
    "scam",
    "rug",
    "halt",
    "suspend",
    "investigation",
    "outflow",
    "sell-off",
    "selloff",
    "liquidation",
    "rumor",
    "rumour",
    "fud",
]

BULLISH_KEYWORDS = [
    "etf",
    "approval",
    "adoption",
    "partnership",
    "listing",
    "inflow",
    "accumulation",
    "breakout",
    "ath",
    "upgrade",
    "launch",
    "institutional",
    "halving",
]


@dataclass
class SentimentResult:
    score: float  # -1 .. 1
    compound: float
    headline_count: int
    volatility_flag: bool
    rumor_flag: bool
    top_themes: List[str]
    x_post_count: int = 0
    x_llm_used: bool = False
    x_sentiment: Optional[str] = None
    x_recommended_action: Optional[str] = None
    x_confidence: Optional[float] = None


class SentimentAnalyzer:
    def __init__(self) -> None:
        self._vader = SentimentIntensityAnalyzer() if SentimentIntensityAnalyzer else None

    def _keyword_adjustment(self, text: str) -> Tuple[float, List[str]]:
        lower = text.lower()
        themes: List[str] = []
        adj = 0.0
        for w in BEARISH_KEYWORDS:
            if w in lower:
                adj -= 0.12
                themes.append(f"bear:{w}")
        for w in BULLISH_KEYWORDS:
            if w in lower:
                adj += 0.08
                themes.append(f"bull:{w}")
        return adj, themes

    def analyze_headlines(self, headlines: List[str]) -> SentimentResult:
        if not headlines:
            return SentimentResult(0.0, 0.0, 0, False, False, [])

        compounds: List[float] = []
        all_themes: List[str] = []
        rumor = False

        for h in headlines:
            if not h.strip():
                continue
            if self._vader:
                comp = self._vader.polarity_scores(h)["compound"]
            else:
                comp = 0.0
            kw_adj, themes = self._keyword_adjustment(h)
            compounds.append(max(-1.0, min(1.0, comp + kw_adj)))
            all_themes.extend(themes)
            if re.search(r"\b(rumor|rumour|unconfirmed|alleged)\b", h, re.I):
                rumor = True

        if not compounds:
            return SentimentResult(0.0, 0.0, 0, False, rumor, [])

        avg = sum(compounds) / len(compounds)
        volatility_flag = avg < -0.35 or rumor
        unique_themes = list(dict.fromkeys(all_themes))[:8]
        return SentimentResult(
            score=avg,
            compound=avg,
            headline_count=len(compounds),
            volatility_flag=volatility_flag,
            rumor_flag=rumor,
            top_themes=unique_themes,
        )
