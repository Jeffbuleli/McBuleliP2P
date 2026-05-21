"""Format OHLCV indicators for LLM context (McBuleli TA layer)."""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from mcbuleli_ai.ai_layer.indicators import IndicatorSnapshot
from mcbuleli_ai.data_layer.market_data import MarketSnapshot

if TYPE_CHECKING:
    from mcbuleli_ai.data_layer.news_data import NewsBundle


def _fmt(v: Optional[float], digits: int = 2) -> str:
    if v is None:
        return "n/a"
    return f"{v:.{digits}f}"


def _indicator_block(label: str, ind: IndicatorSnapshot, price: float) -> List[str]:
    lines = [f"--- {label} ---", f"Price: {_fmt(price)}"]
    lines.append(f"RSI14: {_fmt(ind.rsi14, 1)}")
    lines.append(f"EMA20/50: {_fmt(ind.ema20)} / {_fmt(ind.ema50)}")
    lines.append(f"SMA200: {_fmt(ind.sma200)}")
    ichi = ind.ichimoku
    cloud = (
        "above"
        if ichi.above_cloud is True
        else "below"
        if ichi.above_cloud is False
        else "n/a"
    )
    lines.append(f"Ichimoku: TK {_fmt(ichi.tenkan)} / KJ {_fmt(ichi.kijun)} · cloud {cloud}")
    macd = ind.macd
    lines.append(
        f"MACD hist {_fmt(macd.histogram, 4)} · cross "
        f"{'bull' if macd.bullish_cross else 'bear' if macd.bullish_cross is False else 'n/a'}"
    )
    if ind.fib:
        lines.append(
            f"Fib 38.2/50/61.8: {_fmt(ind.fib.level382)} / {_fmt(ind.fib.level500)} / {_fmt(ind.fib.level618)}"
        )
    lines.append(f"ATR14: {_fmt(ind.atr14)}")
    return lines


def build_market_context_for_llm(
    entry: MarketSnapshot,
    confirm: Optional[MarketSnapshot] = None,
    news: Optional["NewsBundle"] = None,
) -> str:
    """Structured TA summary the LLM must reconcile with X posts (not replace)."""
    from mcbuleli_ai.ai_layer.regime_detector import detect_regime
    from mcbuleli_ai.ai_layer.signal_engine import evaluate_technical_score
    from mcbuleli_ai.data_layer.news_data import NewsBundle

    lines: List[str] = [
        "=== McBuleli technical context (Binance USDM, rule-based) ===",
        f"Symbol: {entry.symbol} · entry TF: {entry.timeframe}",
    ]

    if entry.status != "ok" or entry.indicators is None:
        lines.append("Entry TA: UNAVAILABLE (degraded market data)")
    else:
        ind: IndicatorSnapshot = entry.indicators  # type: ignore
        score, reasons = evaluate_technical_score(
            entry.price,
            ind,
            entry.order_book_imbalance,
            entry.funding_rate,
        )
        lines.extend(_indicator_block("Entry timeframe", ind, entry.price))
        lines.append(f"Rule-based technical_score: {score} (-100..+100)")
        if entry.order_book_imbalance is not None:
            lines.append(f"Order book imbalance: {_fmt(entry.order_book_imbalance, 3)}")
        if entry.funding_rate is not None:
            lines.append(f"Funding rate: {_fmt(entry.funding_rate, 6)}")
        if reasons:
            lines.append("TA factors: " + "; ".join(reasons[:8]))

    if confirm and confirm.status == "ok" and confirm.indicators is not None:
        c_ind: IndicatorSnapshot = confirm.indicators  # type: ignore
        c_score, c_reasons = evaluate_technical_score(
            confirm.price,
            c_ind,
            confirm.order_book_imbalance,
            confirm.funding_rate,
        )
        lines.append("")
        lines.extend(
            _indicator_block(f"Confirm timeframe ({confirm.timeframe})", c_ind, confirm.price)
        )
        lines.append(f"Confirm technical_score: {c_score}")
        if c_reasons:
            lines.append("Confirm factors: " + "; ".join(c_reasons[:6]))
        if entry.status == "ok" and entry.indicators is not None:
            e_score, _ = evaluate_technical_score(
                entry.price,
                entry.indicators,  # type: ignore
                entry.order_book_imbalance,
                entry.funding_rate,
            )
            if e_score > 0 and c_score < 15:
                lines.append("⚠ Higher TF NOT confirming long (McBuleli dampens long bias)")
            elif e_score < 0 and c_score > -15:
                lines.append("⚠ Higher TF NOT confirming short")

    bundle = news or NewsBundle()
    regime: RegimeSnapshot = detect_regime(entry, bundle)
    lines.append("")
    lines.append(f"Regime: {regime.regime.value} ({regime.reason})")
    if regime.atr_pct is not None:
        lines.append(f"ATR%: {_fmt(regime.atr_pct, 2)}")
    if bundle.headlines:
        lines.append(
            f"Headline sentiment (lexicon): {_fmt(bundle.sentiment.score, 3)} "
            f"({bundle.sentiment.headline_count} headlines)"
        )

    lines.append("=== End technical context ===")
    return "\n".join(lines)
