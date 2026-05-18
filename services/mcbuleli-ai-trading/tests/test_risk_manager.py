from __future__ import annotations

from mcbuleli_ai.ai_layer.strategy_selector import StrategySelection
from mcbuleli_ai.core.schemas import (
    Action,
    PortfolioState,
    RiskDecision,
    RiskLevel,
    StrategyKind,
    TradeIntent,
    TradingSignal,
    utc_now_iso,
)
from mcbuleli_ai.risk_management.risk_manager import RiskConfig, RiskManager


def _signal(action: Action = Action.LONG, confidence: int = 60) -> TradingSignal:
    return TradingSignal(
        version=1,
        symbol="BTCUSDT",
        action=action,
        confidence=confidence,
        strategy=StrategyKind.FUTURES,
        risk_level=RiskLevel.MEDIUM,
        timeframe="15m",
        technical_score=50,
        combined_score=50,
        sentiment_score=0.1,
        reasons=[],
        ts=utc_now_iso(),
    )


def _intent() -> TradeIntent:
    return TradeIntent(
        "BTCUSDT", "BUY", StrategyKind.FUTURES, 50.0, 5, 60, RiskLevel.MEDIUM
    )


def test_emergency_stop_pauses():
    rm = RiskManager(
        RiskConfig(10, 2.0, 5.0, 1, 40, True, -0.45)
    )
    r = rm.approve(
        _signal(),
        _intent(),
        PortfolioState(),
        StrategySelection(StrategyKind.FUTURES, "ok", False),
    )
    assert r.decision == RiskDecision.PAUSED


def test_low_confidence_rejected():
    rm = RiskManager(RiskConfig(10, 2.0, 5.0, 1, 40, False, -0.45))
    r = rm.approve(
        _signal(confidence=20),
        _intent(),
        PortfolioState(),
        StrategySelection(StrategyKind.FUTURES, "ok", False),
    )
    assert r.decision == RiskDecision.REJECTED
    assert "LOW_CONFIDENCE" in r.reject_codes


def test_approved_when_ok():
    rm = RiskManager(RiskConfig(10, 2.0, 5.0, 1, 40, False, -0.45))
    r = rm.approve(
        _signal(confidence=55),
        _intent(),
        PortfolioState(equity_usdt=1000),
        StrategySelection(StrategyKind.FUTURES, "ok", False),
    )
    assert r.decision == RiskDecision.APPROVED
    assert r.approved_size_usdt > 0
