from __future__ import annotations

from dataclasses import dataclass

from mcbuleli_ai.ai_layer.regime_detector import MarketRegime, RegimeSnapshot
from mcbuleli_ai.core.schemas import Action, StrategyKind, TradingSignal


@dataclass
class StrategySelection:
    strategy: StrategyKind
    selector_reason: str
    pause_trading: bool


class StrategySelector:
    def select(
        self, signal: TradingSignal, regime: RegimeSnapshot
    ) -> StrategySelection:
        if regime.regime == MarketRegime.SHOCK:
            return StrategySelection(
                StrategyKind.FUTURES,
                "shock_regime_pause_new_risk",
                pause_trading=True,
            )

        if signal.action == Action.HOLD:
            return StrategySelection(
                StrategyKind.FUTURES,
                "hold_signal",
                pause_trading=False,
            )

        if regime.regime in (MarketRegime.TREND_UP, MarketRegime.TREND_DOWN):
            return StrategySelection(
                StrategyKind.FUTURES,
                f"futures_trend_{regime.regime.value}",
                pause_trading=False,
            )

        if regime.regime == MarketRegime.RANGE:
            return StrategySelection(
                StrategyKind.GRID,
                "range_prefers_grid",
                pause_trading=False,
            )

        return StrategySelection(StrategyKind.FUTURES, "default_futures", False)
