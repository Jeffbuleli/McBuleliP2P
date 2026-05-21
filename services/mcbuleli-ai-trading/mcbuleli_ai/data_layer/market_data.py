from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import ccxt

from mcbuleli_ai.ai_layer.indicators import OhlcvCandle, compute_indicators
from mcbuleli_ai.config.settings import RunMode, Settings

logger = logging.getLogger(__name__)


def _exchange_uses_auth(settings: Settings) -> bool:
    """SIGNAL_ONLY/PAPER: public OHLCV only — user keys are for McBuleli app, not this worker."""
    if settings.mode != RunMode.LIVE:
        return False
    return bool(settings.binance_api_key.strip() and settings.binance_api_secret.strip())


def _build_exchange(settings: Settings, *, authenticated: bool) -> ccxt.binanceusdm:
    opts: Dict[str, object] = {"enableRateLimit": True}
    if authenticated:
        opts["apiKey"] = settings.binance_api_key.strip()
        opts["secret"] = settings.binance_api_secret.strip()
    ex = ccxt.binanceusdm(opts)
    if settings.binance_testnet:
        ex.set_sandbox_mode(True)
    return ex


@dataclass
class MarketSnapshot:
    symbol: str
    timeframe: str
    candles: List[OhlcvCandle]
    price: float
    volume_24h: Optional[float]
    funding_rate: Optional[float]
    order_book_imbalance: Optional[float]
    indicators: object
    status: str = "ok"


class MarketDataService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._cache: Dict[str, Tuple[float, MarketSnapshot]] = {}
        self._cache_ttl = 30.0
        self._exchange = _build_exchange(settings, authenticated=_exchange_uses_auth(settings))

    def _cache_key(self, symbol: str, timeframe: str) -> str:
        return f"{symbol}:{timeframe}"

    def fetch_ohlcv(
        self, symbol: str, timeframe: str, limit: int = 120
    ) -> List[OhlcvCandle]:
        raw = self._exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        out: List[OhlcvCandle] = []
        for row in raw:
            out.append(
                OhlcvCandle(
                    time=int(row[0]),
                    open=float(row[1]),
                    high=float(row[2]),
                    low=float(row[3]),
                    close=float(row[4]),
                    volume=float(row[5]),
                )
            )
        return out

    def fetch_order_book_imbalance(self, symbol: str, depth: int = 20) -> Optional[float]:
        try:
            ob = self._exchange.fetch_order_book(symbol, depth)
            bids = ob.get("bids") or []
            asks = ob.get("asks") or []
            bid_vol = sum(b[1] for b in bids[:depth])
            ask_vol = sum(a[1] for a in asks[:depth])
            total = bid_vol + ask_vol
            if total <= 0:
                return None
            return (bid_vol - ask_vol) / total
        except Exception as e:
            logger.warning("order_book_failed: %s", e)
            return None

    def fetch_funding_rate(self, symbol: str) -> Optional[float]:
        try:
            fr = self._exchange.fetch_funding_rate(symbol)
            rate = fr.get("fundingRate")
            return float(rate) if rate is not None else None
        except Exception as e:
            logger.warning("funding_rate_failed: %s", e)
            return None

    def refresh(self, symbol: Optional[str] = None, timeframe: Optional[str] = None) -> MarketSnapshot:
        symbol = symbol or self._settings.symbol
        timeframe = timeframe or self._settings.timeframe
        key = self._cache_key(symbol, timeframe)
        now = time.time()
        cached = self._cache.get(key)
        if cached and now - cached[0] < self._cache_ttl:
            return cached[1]

        try:
            snap = self._refresh_once(symbol, timeframe)
            self._cache[key] = (now, snap)
            return snap
        except Exception as e:
            err = str(e)
            if _exchange_uses_auth(self._settings) and (
                "-2015" in err or "Invalid API-key" in err
            ):
                logger.warning(
                    "market_data_auth_failed_retry_public: %s", e
                )
                self._exchange = _build_exchange(
                    self._settings, authenticated=False
                )
                try:
                    snap = self._refresh_once(symbol, timeframe)
                    self._cache[key] = (now, snap)
                    return snap
                except Exception as e2:
                    logger.error("market_data_degraded: %s", e2)
            else:
                logger.error("market_data_degraded: %s", e)
            return MarketSnapshot(
                symbol=symbol,
                timeframe=timeframe,
                candles=[],
                price=0.0,
                volume_24h=None,
                funding_rate=None,
                order_book_imbalance=None,
                indicators=None,
                status="degraded",
            )

    def _refresh_once(self, symbol: str, timeframe: str) -> MarketSnapshot:
        candles = self.fetch_ohlcv(symbol, timeframe)
        indicators, price = compute_indicators(candles)
        imbalance = self.fetch_order_book_imbalance(symbol)
        funding = self.fetch_funding_rate(symbol)
        ticker = self._exchange.fetch_ticker(symbol)
        vol = ticker.get("quoteVolume")
        return MarketSnapshot(
            symbol=symbol,
            timeframe=timeframe,
            candles=candles,
            price=price,
            volume_24h=float(vol) if vol is not None else None,
            funding_rate=funding,
            order_book_imbalance=imbalance,
            indicators=indicators,
            status="ok",
        )
