from __future__ import annotations

from typing import Optional

from mcbuleli_ai.core.schemas import Action, RiskLevel, StrategyKind, TradeIntent, TradingSignal
from mcbuleli_ai.ai_layer.strategy_selector import StrategySelection
from mcbuleli_ai.strategies.base import BaseStrategy


class FuturesStrategy(BaseStrategy):
    def __init__(
        self, default_margin_usdt: float = 50.0, default_leverage: int = 5
    ) -> None:
        self._margin = default_margin_usdt
        self._leverage = default_leverage

    def build_intent(
        self, signal: TradingSignal, selection: StrategySelection
    ) -> Optional[TradeIntent]:
        if selection.strategy != StrategyKind.FUTURES:
            return None
        if signal.action == Action.LONG:
            side = "BUY"
        elif signal.action == Action.SHORT:
            side = "SELL"
        else:
            return None

        return TradeIntent(
            symbol=signal.symbol,
            side=side,
            strategy=StrategyKind.FUTURES,
            margin_usdt=self._margin,
            leverage=self._leverage,
            confidence=signal.confidence,
            risk_level=signal.risk_level,
            metadata={"selector": selection.selector_reason},
        )
