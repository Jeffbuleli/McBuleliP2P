from __future__ import annotations

from mcbuleli_ai.ai_layer.indicators import OhlcvCandle, compute_fib, compute_indicators


def _fake_candles(n: int = 120, start: float = 100.0) -> list:
    out = []
    price = start
    for i in range(n):
        o = price
        price = price * (1.0 + (0.001 if i % 5 else -0.0005))
        out.append(
            OhlcvCandle(
                time=i * 60_000,
                open=o,
                high=price * 1.002,
                low=price * 0.998,
                close=price,
                volume=1000.0,
            )
        )
    return out


def test_compute_indicators_returns_rsi_and_ichimoku():
    candles = _fake_candles()
    snap, price = compute_indicators(candles)
    assert price > 0
    assert snap.rsi14 is not None
    assert snap.ichimoku.tenkan is not None


def test_fib_levels():
    candles = _fake_candles(60, 50.0)
    fib = compute_fib(candles)
    assert fib is not None
    assert fib.swing_high >= fib.swing_low
    assert fib.level618 <= fib.swing_high
