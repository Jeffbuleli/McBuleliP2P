from __future__ import annotations


def normalize_binance_symbol(raw: str) -> str:
    """BTC/USDT:USDT or BTCUSDT → BTCUSDT."""
    s = raw.replace("/", "")
    if ":" in s:
        s = s.split(":", 1)[0]
    return s.upper()


def to_ccxt_futures_symbol(raw: str) -> str:
    """BTCUSDT → BTC/USDT:USDT for ccxt binanceusdm."""
    if "/" in raw:
        return raw
    s = normalize_binance_symbol(raw)
    if s.endswith("USDT") and len(s) > 4:
        base = s[:-4]
        return f"{base}/USDT:USDT"
    return raw
