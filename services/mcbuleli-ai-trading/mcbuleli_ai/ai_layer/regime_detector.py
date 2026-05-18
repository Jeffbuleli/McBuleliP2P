from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from mcbuleli_ai.ai_layer.indicators import IndicatorSnapshot
from mcbuleli_ai.data_layer.market_data import MarketSnapshot
from mcbuleli_ai.data_layer.news_data import NewsBundle


class MarketRegime(str, Enum):
    TREND_UP = "TREND_UP"
    TREND_DOWN = "TREND_DOWN"
    RANGE = "RANGE"
    SHOCK = "SHOCK"


@dataclass
class RegimeSnapshot:
    regime: MarketRegime
    atr_pct: Optional[float]
    reason: str


def detect_regime(market: MarketSnapshot, news: NewsBundle) -> RegimeSnapshot:
    if news.sentiment.volatility_flag or news.sentiment.rumor_flag:
        return RegimeSnapshot(MarketRegime.SHOCK, None, "news_shock")

    if market.status != "ok" or market.indicators is None:
        return RegimeSnapshot(MarketRegime.RANGE, None, "no_data")

    ind: IndicatorSnapshot = market.indicators  # type: ignore
    atr_pct = None
    if ind.atr14 and market.price > 0:
        atr_pct = (ind.atr14 / market.price) * 100

    if atr_pct is not None and atr_pct > 4.0:
        return RegimeSnapshot(MarketRegime.SHOCK, atr_pct, "high_atr")

    if ind.ema20 and ind.ema50:
        if ind.ema20 > ind.ema50 and ind.ichimoku.above_cloud is True:
            return RegimeSnapshot(MarketRegime.TREND_UP, atr_pct, "trend_up")
        if ind.ema20 < ind.ema50 and ind.ichimoku.above_cloud is False:
            return RegimeSnapshot(MarketRegime.TREND_DOWN, atr_pct, "trend_down")

    return RegimeSnapshot(MarketRegime.RANGE, atr_pct, "range")
