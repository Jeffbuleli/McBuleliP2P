from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional


class Action(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"
    HOLD = "HOLD"


class StrategyKind(str, Enum):
    DCA = "DCA"
    GRID = "GRID"
    FUTURES = "FUTURES"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RiskDecision(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REDUCED = "REDUCED"
    PAUSED = "PAUSED"


@dataclass
class TradingSignal:
    """Structured signal aligned with McBuleli bot-intelligence output."""

    version: int
    symbol: str
    action: Action
    confidence: int  # 0-100
    strategy: StrategyKind
    risk_level: RiskLevel
    timeframe: str
    technical_score: int  # -100..100 (McBuleli-style)
    combined_score: int  # after news/sentiment + MTF adjust
    sentiment_score: float  # -1..1
    reasons: List[str]
    ts: str
    x_position_action: Optional[str] = None
    x_new_direction: Optional[str] = None
    x_sentiment: Optional[str] = None
    x_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        out: Dict[str, Any] = {
            "version": self.version,
            "symbol": self.symbol,
            "action": self.action.value,
            "confidence": self.confidence,
            "strategy": self.strategy.value,
            "risk_level": self.risk_level.value,
            "timeframe": self.timeframe,
            "technical_score": self.technical_score,
            "combined_score": self.combined_score,
            "sentiment_score": round(self.sentiment_score, 4),
            "reasons": self.reasons,
            "ts": self.ts,
        }
        if self.x_position_action:
            out["x_position_action"] = self.x_position_action
        if self.x_new_direction:
            out["x_new_direction"] = self.x_new_direction
        if self.x_sentiment:
            out["x_sentiment"] = self.x_sentiment
        if self.x_reason:
            out["x_reason"] = self.x_reason
        return out


@dataclass
class TradeIntent:
    symbol: str
    side: str  # BUY / SELL
    strategy: StrategyKind
    margin_usdt: float
    leverage: int
    confidence: int
    risk_level: RiskLevel
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RiskResult:
    decision: RiskDecision
    approved_size_usdt: float
    approved_leverage: int
    reject_reasons: List[str] = field(default_factory=list)
    reject_codes: List[str] = field(default_factory=list)


@dataclass
class PortfolioState:
    open_positions: int = 0
    daily_pnl_pct: float = 0.0
    equity_usdt: float = 1000.0
    last_close_at: Optional[datetime] = None
    trades_today: int = 0


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )
