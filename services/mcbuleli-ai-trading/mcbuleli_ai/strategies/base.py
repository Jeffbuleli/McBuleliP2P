from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from mcbuleli_ai.core.schemas import TradeIntent, TradingSignal
from mcbuleli_ai.ai_layer.strategy_selector import StrategySelection


class BaseStrategy(ABC):
    @abstractmethod
    def build_intent(
        self, signal: TradingSignal, selection: StrategySelection
    ) -> Optional[TradeIntent]:
        pass
