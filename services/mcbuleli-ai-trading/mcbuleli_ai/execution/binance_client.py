from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import ccxt

from mcbuleli_ai.config.settings import RunMode, Settings

logger = logging.getLogger(__name__)


class BinanceClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._enabled_live = settings.mode == RunMode.LIVE
        opts: Dict[str, Any] = {"enableRateLimit": True}
        if settings.binance_api_key:
            opts["apiKey"] = settings.binance_api_key
            opts["secret"] = settings.binance_api_secret
        self._exchange = ccxt.binanceusdm(opts)
        if settings.binance_testnet:
            self._exchange.set_sandbox_mode(True)

    def can_execute_live(self) -> bool:
        if not self._enabled_live:
            return False
        if not self._settings.binance_api_key:
            return False
        return True

    def market_order(
        self,
        symbol: str,
        side: str,
        amount: float,
        reduce_only: bool = False,
    ) -> Dict[str, Any]:
        if not self.can_execute_live():
            raise RuntimeError("LIVE execution disabled — use PAPER or SIGNAL_ONLY")
        params = {}
        if reduce_only:
            params["reduceOnly"] = True
        return self._exchange.create_order(
            symbol, "market", side.lower(), amount, None, params
        )
