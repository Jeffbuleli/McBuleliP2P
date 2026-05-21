"""Standardized ignore / reject reason codes (parity with Node bot-decision)."""

from enum import Enum


class DecisionCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    AI = "AI"
    RISK = "RISK"
    EXECUTION = "EXECUTION"
    SYSTEM = "SYSTEM"


class ReasonCode(str, Enum):
    LOW_SCORE = "LOW_SCORE"
    TREND_CONFLICT = "TREND_CONFLICT"
    HIGH_VOLATILITY = "HIGH_VOLATILITY"
    RANGE_MARKET = "RANGE_MARKET"
    MACRO_EVENT_WARNING = "MACRO_EVENT_WARNING"
    HIGH_NEWS_RISK = "HIGH_NEWS_RISK"
    FUNDING_TOO_HIGH = "FUNDING_TOO_HIGH"
    COOLDOWN_ACTIVE = "COOLDOWN_ACTIVE"
    HOLD_SIGNAL = "HOLD_SIGNAL"
