from __future__ import annotations

from typing import Optional

from mcbuleli_ai.core.schemas import StrategyKind, TradeIntent, TradingSignal
from mcbuleli_ai.ai_layer.strategy_selector import StrategySelection
from mcbuleli_ai.strategies.base import BaseStrategy


class GridStrategy(BaseStrategy):
    """Grid hint — McBuleli grid engine places limits."""

    def build_intent(
        self, signal: TradingSignal, selection: StrategySelection
    ) -> Optional[TradeIntent]:
        if selection.strategy != StrategyKind.GRID:
            return None
        return TradeIntent(
            symbol=signal.symbol,
            side="BUY",
            strategy=StrategyKind.GRID,
            margin_usdt=30.0,
            leverage=1,
            confidence=signal.confidence,
            risk_level=signal.risk_level,
            metadata={"hint": "refresh_grid_levels", "selector": selection.selector_reason},
        )
