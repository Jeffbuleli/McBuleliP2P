from __future__ import annotations

from typing import List, Optional, Tuple

from mcbuleli_ai.ai_layer.indicators import IndicatorSnapshot
from mcbuleli_ai.utils.symbols import normalize_binance_symbol
from mcbuleli_ai.core.schemas import Action, RiskLevel, StrategyKind, TradingSignal, utc_now_iso
from mcbuleli_ai.data_layer.market_data import MarketSnapshot
from mcbuleli_ai.data_layer.news_data import NewsBundle


def _clamp(n: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, n))


def evaluate_technical_score(
    price: float,
    ind: IndicatorSnapshot,
    order_book_imbalance: Optional[float],
    funding_rate: Optional[float],
) -> Tuple[int, List[str]]:
    """
    McBuleli parity with src/lib/bot-intelligence/evaluate-signal.ts
    + MACD histogram / cross.
    """
    score = 0
    reasons: List[str] = []

    if ind.rsi14 is not None:
        if ind.rsi14 < 32:
            score += 18
            reasons.append("RSI oversold")
        elif ind.rsi14 > 68:
            score -= 18
            reasons.append("RSI overbought")
        elif ind.rsi14 > 55:
            score += 6
            reasons.append("RSI bullish")
        elif ind.rsi14 < 45:
            score -= 6
            reasons.append("RSI bearish")

    if ind.ema20 is not None and ind.ema50 is not None:
        if ind.ema20 > ind.ema50 and price > ind.ema20:
            score += 14
            reasons.append("EMA trend up")
        elif ind.ema20 < ind.ema50 and price < ind.ema20:
            score -= 14
            reasons.append("EMA trend down")

    if ind.sma200 is not None:
        if price > ind.sma200:
            score += 8
            reasons.append("Above SMA200")
        else:
            score -= 8
            reasons.append("Below SMA200")

    ichi = ind.ichimoku
    if ichi.above_cloud is True:
        score += 12
        reasons.append("Ichimoku above cloud")
    elif ichi.above_cloud is False:
        score -= 12
        reasons.append("Ichimoku below cloud")

    if ichi.tenkan is not None and ichi.kijun is not None:
        if ichi.tenkan > ichi.kijun:
            score += 6
            reasons.append("TK cross bullish")
        else:
            score -= 6
            reasons.append("TK cross bearish")

    if ind.fib:
        near618 = abs(price - ind.fib.level618) / price < 0.008 if price else False
        near382 = abs(price - ind.fib.level382) / price < 0.008 if price else False
        if near618:
            score += 10
            reasons.append("Near Fib 61.8% support")
        if near382 and price < ind.fib.level500:
            score -= 8
            reasons.append("Near Fib 38.2% resistance")

    macd = ind.macd
    if macd.histogram is not None:
        if macd.histogram > 0:
            score += 5
            reasons.append("MACD histogram positive")
        else:
            score -= 5
            reasons.append("MACD histogram negative")
    if macd.bullish_cross:
        score += 8
        reasons.append("MACD bullish cross")

    if order_book_imbalance is not None:
        if order_book_imbalance > 0.12:
            score += 10
            reasons.append("Order book bid pressure")
        elif order_book_imbalance < -0.12:
            score -= 10
            reasons.append("Order book ask pressure")

    if funding_rate is not None:
        if funding_rate < -0.0001:
            score += 5
            reasons.append("Negative funding (long bias)")
        elif funding_rate > 0.0003:
            score -= 5
            reasons.append("High positive funding")

    if ind.atr14 is not None and price > 0:
        atr_pct = (ind.atr14 / price) * 100
        if atr_pct > 3.5:
            score = int(round(score * 0.7))
            reasons.append("High volatility — score dampened")

    return _clamp(int(round(score)), -100, 100), reasons[:10]


def apply_sentiment_adjustment(
    technical_score: int,
    sentiment_score: float,
    news: NewsBundle,
) -> Tuple[int, List[str]]:
    reasons: List[str] = []
    adj = technical_score

    if news.sentiment.rumor_flag:
        adj = int(round(adj * 0.75))
        reasons.append("Rumor/unconfirmed headlines — dampened")

    if news.sentiment.volatility_flag:
        adj = int(round(adj * 0.8))
        reasons.append("Negative news cluster — dampened")

    if sentiment_score > 0.25:
        adj += 8
        reasons.append("News sentiment bullish")
    elif sentiment_score < -0.25:
        adj -= 12
        reasons.append("News sentiment bearish")

    if news.sentiment.top_themes:
        reasons.append("Themes: " + ", ".join(news.sentiment.top_themes[:3]))

    return _clamp(adj, -100, 100), reasons


def score_to_action(combined_score: int, min_edge: int = 20) -> Action:
    if combined_score >= min_edge:
        return Action.LONG
    if combined_score <= -min_edge:
        return Action.SHORT
    return Action.HOLD


def score_to_confidence(combined_score: int) -> int:
    return _clamp(abs(combined_score), 0, 100)


def score_to_risk_level(
    combined_score: int,
    atr_pct: Optional[float],
    news_volatile: bool,
) -> RiskLevel:
    if news_volatile or (atr_pct is not None and atr_pct > 3.5):
        return RiskLevel.HIGH
    if abs(combined_score) >= 55:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


class SignalEngine:
    def run(
        self,
        market: MarketSnapshot,
        news: NewsBundle,
        confirm_market: Optional[MarketSnapshot] = None,
        min_edge: int = 20,
    ) -> TradingSignal:
        if market.status != "ok" or market.indicators is None:
            return TradingSignal(
                version=1,
                symbol=normalize_binance_symbol(market.symbol),
                action=Action.HOLD,
                confidence=0,
                strategy=StrategyKind.FUTURES,
                risk_level=RiskLevel.HIGH,
                timeframe=market.timeframe,
                technical_score=0,
                combined_score=0,
                sentiment_score=news.sentiment.score,
                reasons=["market_data_degraded"],
                ts=utc_now_iso(),
            )

        ind: IndicatorSnapshot = market.indicators  # type: ignore[assignment]
        tech, tech_reasons = evaluate_technical_score(
            market.price,
            ind,
            market.order_book_imbalance,
            market.funding_rate,
        )

        combined, sent_reasons = apply_sentiment_adjustment(
            tech, news.sentiment.score, news
        )

        if confirm_market and confirm_market.status == "ok" and confirm_market.indicators:
            c_ind: IndicatorSnapshot = confirm_market.indicators  # type: ignore
            c_score, _ = evaluate_technical_score(
                confirm_market.price,
                c_ind,
                confirm_market.order_book_imbalance,
                confirm_market.funding_rate,
            )
            if combined > 0 and c_score < 15:
                combined = int(round(combined * 0.6))
                sent_reasons.append("Higher TF not confirming long")
            elif combined < 0 and c_score > -15:
                combined = int(round(combined * 0.6))
                sent_reasons.append("Higher TF not confirming short")

        atr_pct = None
        if ind.atr14 and market.price > 0:
            atr_pct = (ind.atr14 / market.price) * 100

        action = score_to_action(combined)
        confidence = score_to_confidence(combined) if action != Action.HOLD else 0

        reasons = tech_reasons + sent_reasons
        if news.headlines:
            reasons.append("News samples: %d" % len(news.headlines))

        symbol_out = normalize_binance_symbol(market.symbol)

        return TradingSignal(
            version=1,
            symbol=symbol_out,
            action=action,
            confidence=confidence,
            strategy=StrategyKind.FUTURES,
            risk_level=score_to_risk_level(
                combined, atr_pct, news.sentiment.volatility_flag
            ),
            timeframe=market.timeframe,
            technical_score=tech,
            combined_score=combined,
            sentiment_score=news.sentiment.score,
            reasons=reasons[:12],
            ts=utc_now_iso(),
        )
