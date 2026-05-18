from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Sequence, Tuple

import numpy as np
import pandas as pd


@dataclass
class OhlcvCandle:
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass
class FibLevels:
    swing_high: float
    swing_low: float
    level382: float
    level500: float
    level618: float


@dataclass
class IchimokuSnapshot:
    tenkan: Optional[float]
    kijun: Optional[float]
    span_a: Optional[float]
    span_b: Optional[float]
    above_cloud: Optional[bool]


@dataclass
class MacdSnapshot:
    macd: Optional[float]
    signal: Optional[float]
    histogram: Optional[float]
    bullish_cross: Optional[bool]


@dataclass
class IndicatorSnapshot:
    rsi14: Optional[float]
    ema20: Optional[float]
    ema50: Optional[float]
    sma200: Optional[float]
    ichimoku: IchimokuSnapshot
    fib: Optional[FibLevels]
    atr14: Optional[float]
    macd: MacdSnapshot


def candles_to_df(candles: Sequence[OhlcvCandle]) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "time": [c.time for c in candles],
            "open": [c.open for c in candles],
            "high": [c.high for c in candles],
            "low": [c.low for c in candles],
            "close": [c.close for c in candles],
            "volume": [c.volume for c in candles],
        }
    )


def _ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def compute_rsi(closes: pd.Series, period: int = 14) -> Optional[float]:
    if len(closes) < period + 1:
        return None
    delta = closes.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    val = rsi.iloc[-1]
    return float(val) if pd.notna(val) else None


def compute_atr(df: pd.DataFrame, period: int = 14) -> Optional[float]:
    if len(df) < period + 1:
        return None
    high, low, close = df["high"], df["low"], df["close"]
    prev_close = close.shift(1)
    tr = pd.concat(
        [
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    atr = tr.rolling(period).mean().iloc[-1]
    return float(atr) if pd.notna(atr) else None


def compute_ichimoku(df: pd.DataFrame) -> IchimokuSnapshot:
    """Aligns with McBuleli TS: conversion=9, base=26, span=52, displacement=26."""
    if len(df) < 52:
        return IchimokuSnapshot(None, None, None, None, None)

    high, low, close = df["high"], df["low"], df["close"]
    conv = (high.rolling(9).max() + low.rolling(9).min()) / 2
    base = (high.rolling(26).max() + low.rolling(26).min()) / 2
    span_a = ((conv + base) / 2).shift(26)
    span_b = ((high.rolling(52).max() + low.rolling(52).min()) / 2).shift(26)

    tenkan = float(conv.iloc[-1]) if pd.notna(conv.iloc[-1]) else None
    kijun = float(base.iloc[-1]) if pd.notna(base.iloc[-1]) else None
    sa = float(span_a.iloc[-1]) if pd.notna(span_a.iloc[-1]) else None
    sb = float(span_b.iloc[-1]) if pd.notna(span_b.iloc[-1]) else None
    price = float(close.iloc[-1])

    above: Optional[bool] = None
    if sa is not None and sb is not None:
        above = price > max(sa, sb)

    return IchimokuSnapshot(tenkan, kijun, sa, sb, above)


def compute_macd(closes: pd.Series) -> MacdSnapshot:
    if len(closes) < 35:
        return MacdSnapshot(None, None, None, None)
    ema12 = _ema(closes, 12)
    ema26 = _ema(closes, 26)
    macd_line = ema12 - ema26
    signal_line = _ema(macd_line, 9)
    hist = macd_line - signal_line
    m = float(macd_line.iloc[-1])
    s = float(signal_line.iloc[-1])
    h = float(hist.iloc[-1])
    prev_h = float(hist.iloc[-2]) if len(hist) > 1 else 0.0
    cross = h > 0 and prev_h <= 0
    return MacdSnapshot(m, s, h, cross)


def compute_fib(candles: Sequence[OhlcvCandle]) -> Optional[FibLevels]:
    """Swing high/low over last 50 bars — same logic as McBuleli TS."""
    if len(candles) < 20:
        return None
    slice_c = list(candles)[-50:]
    swing_high = max(c.high for c in slice_c)
    swing_low = min(c.low for c in slice_c)
    rng = swing_high - swing_low
    if rng <= 0:
        return None
    return FibLevels(
        swing_high=swing_high,
        swing_low=swing_low,
        level382=swing_high - rng * 0.382,
        level500=swing_high - rng * 0.5,
        level618=swing_high - rng * 0.618,
    )


def compute_indicators(candles: Sequence[OhlcvCandle]) -> Tuple[IndicatorSnapshot, float]:
    df = candles_to_df(candles)
    closes = df["close"]
    price = float(closes.iloc[-1])

    rsi = compute_rsi(closes)
    ema20 = float(_ema(closes, 20).iloc[-1]) if len(closes) >= 20 else None
    ema50 = float(_ema(closes, 50).iloc[-1]) if len(closes) >= 50 else None
    sma200 = (
        float(closes.rolling(200).mean().iloc[-1]) if len(closes) >= 200 else None
    )
    atr = compute_atr(df)
    ichi = compute_ichimoku(df)
    macd = compute_macd(closes)
    fib = compute_fib(candles)

    snap = IndicatorSnapshot(
        rsi14=rsi,
        ema20=ema20,
        ema50=ema50,
        sma200=sma200,
        ichimoku=ichi,
        fib=fib,
        atr14=atr,
        macd=macd,
    )
    return snap, price
