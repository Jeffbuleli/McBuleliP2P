from __future__ import annotations

from typing import Optional

from mcbuleli_ai.core.schemas import Action, StrategyKind, TradeIntent, TradingSignal
from mcbuleli_ai.ai_layer.strategy_selector import StrategySelection
from mcbuleli_ai.strategies.base import BaseStrategy


class DcaStrategy(BaseStrategy):
    """Spot DCA intent — SIGNAL_ONLY in MVP (no execution here)."""

    def build_intent(
        self, signal: TradingSignal, selection: StrategySelection
    ) -> Optional[TradeIntent]:
        if selection.strategy != StrategyKind.DCA:
            return None
        if signal.action != Action.LONG:
            return None
        return TradeIntent(
            symbol=signal.symbol.replace("USDT", "") + "USDT",
            side="BUY",
            strategy=StrategyKind.DCA,
            margin_usdt=25.0,
            leverage=1,
            confidence=signal.confidence,
            risk_level=signal.risk_level,
            metadata={"mode": "spot_dca_signal"},
        )
