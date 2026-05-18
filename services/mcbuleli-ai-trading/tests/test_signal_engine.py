from __future__ import annotations

from mcbuleli_ai.ai_layer.indicators import (
    FibLevels,
    IchimokuSnapshot,
    IndicatorSnapshot,
    MacdSnapshot,
    OhlcvCandle,
    compute_indicators,
)
from mcbuleli_ai.ai_layer.signal_engine import SignalEngine, evaluate_technical_score
from mcbuleli_ai.core.schemas import Action
from mcbuleli_ai.data_layer.market_data import MarketSnapshot
from mcbuleli_ai.data_layer.news_data import NewsBundle
from mcbuleli_ai.data_layer.sentiment_analyzer import SentimentResult


def _candles(n: int = 120) -> list:
    candles = []
    p = 100.0
    for i in range(n):
        p *= 1.001
        candles.append(
            OhlcvCandle(i, p, p * 1.01, p * 0.99, p, 1000.0)
        )
    return candles


def test_evaluate_technical_score_bullish_bias():
    candles = _candles()
    ind, price = compute_indicators(candles)
    score, reasons = evaluate_technical_score(price, ind, 0.15, -0.0002)
    assert -100 <= score <= 100
    assert len(reasons) > 0


def test_signal_engine_hold_on_degraded():
    engine = SignalEngine()
    market = MarketSnapshot(
        "BTC/USDT:USDT", "15m", [], 0.0, None, None, None, None, "degraded"
    )
    news = NewsBundle(sentiment=SentimentResult(0, 0, 0, False, False, []))
    sig = engine.run(market, news)
    assert sig.action == Action.HOLD
    assert sig.confidence == 0
