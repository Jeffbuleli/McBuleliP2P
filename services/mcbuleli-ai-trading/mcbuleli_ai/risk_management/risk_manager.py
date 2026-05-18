from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

from mcbuleli_ai.config.settings import Settings
from mcbuleli_ai.core.schemas import (
    Action,
    PortfolioState,
    RiskDecision,
    RiskLevel,
    RiskResult,
    TradeIntent,
    TradingSignal,
)
from mcbuleli_ai.ai_layer.strategy_selector import StrategySelection


@dataclass
class RiskConfig:
    max_leverage: int
    max_risk_pct: float
    max_daily_drawdown_pct: float
    max_positions: int
    min_confidence: int
    emergency_stop: bool
    sentiment_pause_threshold: float


def risk_config_from_settings(s: Settings) -> RiskConfig:
    return RiskConfig(
        max_leverage=s.max_leverage,
        max_risk_pct=s.max_risk_pct,
        max_daily_drawdown_pct=s.max_daily_drawdown_pct,
        max_positions=s.max_positions,
        min_confidence=s.min_confidence,
        emergency_stop=s.emergency_stop,
        sentiment_pause_threshold=s.sentiment_pause_threshold,
    )


class RiskManager:
    """Hard gate — AI cannot bypass."""

    def __init__(self, config: RiskConfig) -> None:
        self._config = config

    def approve(
        self,
        signal: TradingSignal,
        intent: Optional[TradeIntent],
        portfolio: PortfolioState,
        selection: StrategySelection,
    ) -> RiskResult:
        codes: List[str] = []
        reasons: List[str] = []

        if self._config.emergency_stop:
            return RiskResult(
                RiskDecision.PAUSED,
                0.0,
                0,
                ["Emergency stop active"],
                ["EMERGENCY_STOP"],
            )

        if selection.pause_trading:
            return RiskResult(
                RiskDecision.PAUSED,
                0.0,
                0,
                [selection.selector_reason],
                ["REGIME_PAUSE"],
            )

        if signal.action == Action.HOLD:
            return RiskResult(
                RiskDecision.REJECTED,
                0.0,
                0,
                ["Signal is HOLD"],
                ["HOLD_SIGNAL"],
            )

        if signal.sentiment_score <= self._config.sentiment_pause_threshold:
            return RiskResult(
                RiskDecision.PAUSED,
                0.0,
                0,
                ["News sentiment below pause threshold"],
                ["SENTIMENT_PAUSE"],
            )

        if signal.confidence < self._config.min_confidence:
            codes.append("LOW_CONFIDENCE")
            reasons.append(
                f"Confidence {signal.confidence} < min {self._config.min_confidence}"
            )

        if portfolio.open_positions >= self._config.max_positions:
            codes.append("MAX_POSITIONS")
            reasons.append("Max open positions reached")

        if portfolio.daily_pnl_pct <= -self._config.max_daily_drawdown_pct:
            codes.append("MAX_DAILY_DRAWDOWN")
            reasons.append("Daily drawdown limit hit")

        if portfolio.last_close_at:
            elapsed_min = (
                datetime.now(timezone.utc) - portfolio.last_close_at
            ).total_seconds() / 60.0
            if elapsed_min < 5:
                codes.append("REENTRY_COOLDOWN")
                reasons.append("Re-entry cooldown (5 min)")

        if portfolio.trades_today >= 24:
            codes.append("OVERTRADING")
            reasons.append("Max trades per day")

        if intent and intent.leverage > self._config.max_leverage:
            codes.append("MAX_LEVERAGE")
            reasons.append(f"Leverage {intent.leverage} > max")

        if signal.risk_level == RiskLevel.HIGH and signal.confidence < 55:
            codes.append("HIGH_RISK_LOW_CONF")
            reasons.append("HIGH risk level needs confidence >= 55")

        if codes:
            return RiskResult(RiskDecision.REJECTED, 0.0, 0, reasons, codes)

        if not intent:
            return RiskResult(
                RiskDecision.REJECTED,
                0.0,
                0,
                ["No trade intent"],
                ["NO_INTENT"],
            )

        size = min(
            intent.margin_usdt,
            portfolio.equity_usdt * (self._config.max_risk_pct / 100.0),
        )
        lev = min(intent.leverage, self._config.max_leverage)

        if signal.risk_level == RiskLevel.HIGH:
            size *= 0.5
            return RiskResult(
                RiskDecision.REDUCED,
                round(size, 2),
                lev,
                ["Size halved due to HIGH risk level"],
                [],
            )

        return RiskResult(RiskDecision.APPROVED, round(size, 2), lev, [], [])
