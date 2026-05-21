from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from mcbuleli_ai.config.settings import Settings
from mcbuleli_ai.data_layer.market_analysis_context import build_market_context_for_llm
from mcbuleli_ai.data_layer.market_data import MarketSnapshot
from mcbuleli_ai.data_layer.news_data import NewsBundle
from mcbuleli_ai.data_layer.openai_client import openai_json_completion
from mcbuleli_ai.data_layer.x_analyst_prompt import (
    XPositionContext,
    X_ANALYST_SYSTEM_PROMPT,
    build_x_analyst_user_message,
)

logger = logging.getLogger(__name__)

POSITION_ACTIONS = frozenset(
    {"close_now", "close_and_reverse", "monitor", "no_action"}
)


class XAnalystJson(BaseModel):
    coins: List[str] = Field(default_factory=list)
    sentiment: str = "neutral"
    confidence: float = 0.0
    signals: List[str] = Field(default_factory=list)
    ta_alignment: str = "mixed"
    position_action: str = "no_action"
    reason: str = ""
    recommended_direction: str = "none"
    new_direction: Optional[str] = None
    action: Optional[str] = None
    recommended_action: Optional[str] = None
    reasoning: Optional[str] = None

    @field_validator("sentiment")
    @classmethod
    def normalize_sentiment(cls, v: str) -> str:
        s = (v or "neutral").strip().lower()
        if s in ("bullish", "bearish", "neutral", "volatile"):
            return s
        if "volat" in s:
            return "volatile"
        if "bull" in s:
            return "bullish"
        if "bear" in s:
            return "bearish"
        return "neutral"

    @field_validator("confidence")
    @classmethod
    def clamp_confidence(cls, v: float) -> float:
        try:
            n = float(v)
        except (TypeError, ValueError):
            return 0.0
        n = max(0.0, min(100.0, n))
        return n

    @field_validator("ta_alignment")
    @classmethod
    def normalize_ta_alignment(cls, v: str) -> str:
        s = (v or "mixed").strip().lower()
        if s in ("aligned", "mixed", "against_ta", "against"):
            return "against_ta" if "against" in s else s
        return "mixed"

    def resolved_position_action(self) -> str:
        raw = (
            (self.action or "")
            or self.position_action
            or (self.recommended_action or "")
            or "no_action"
        ).strip().lower()
        if raw in POSITION_ACTIONS:
            return raw
        if "close_and_reverse" in raw or "reverse" in raw:
            return "close_and_reverse"
        if "close" in raw:
            return "close_now"
        if raw in ("monitor", "hold", "wait"):
            return "monitor"
        return "no_action"

    def resolved_reason(self) -> str:
        base = (self.reason or self.reasoning or "").strip()[:500]
        align = self.ta_alignment
        if align and align != "mixed":
            return f"[TA {align}] {base}"[:500]
        return base

    def resolved_new_direction(self) -> Optional[str]:
        d = (self.new_direction or self.recommended_direction or "").strip().lower()
        if d in ("long", "short"):
            return d.upper()
        return None


@dataclass
class XAnalystResult:
    coins: List[str]
    sentiment: str
    signals: List[str]
    confidence: float
    position_action: str
    reason: str
    recommended_direction: Optional[str]
    new_direction: Optional[str]
    ta_alignment: str = "mixed"

    def sentiment_score(self) -> float:
        base = {
            "bullish": 0.42,
            "bearish": -0.42,
            "neutral": 0.0,
            "volatile": -0.14,
        }.get(self.sentiment, 0.0)
        if self.ta_alignment == "aligned":
            base *= 1.12
        elif self.ta_alignment == "against_ta":
            base *= 0.55
        if self.position_action == "close_and_reverse":
            base *= 1.15
        elif self.position_action == "close_now":
            base *= 1.05
        weight = self.confidence / 100.0
        return max(-1.0, min(1.0, base * (0.35 + 0.65 * weight)))

    def entry_action_hint(self) -> Optional[str]:
        if self.position_action == "close_and_reverse" and self.new_direction:
            return self.new_direction
        d = (self.recommended_direction or "").lower()
        if d == "long":
            return "LONG"
        if d == "short":
            return "SHORT"
        if self.ta_alignment == "against_ta":
            return None
        if self.sentiment == "bullish" and self.confidence >= 58:
            return "LONG"
        if self.sentiment == "bearish" and self.confidence >= 58:
            return "SHORT"
        return None

    def opposes_side(self, side: str) -> bool:
        s = side.upper()
        if s == "LONG" and self.sentiment in ("bearish", "volatile"):
            return self.confidence >= 75
        if s == "SHORT" and self.sentiment == "bullish":
            return self.confidence >= 75
        return False


def _extract_json_object(raw: str) -> Optional[dict]:
    import json
    import re

    text = (raw or "").strip()
    if not text:
        return None
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


class XLLMAnalyzer:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def is_configured(self) -> bool:
        return bool(
            self._settings.x_llm_enabled
            and self._settings.openai_api_key.strip()
        )

    def analyze_posts(
        self,
        posts: List[str],
        *,
        symbol: str,
        position: Optional[XPositionContext] = None,
        market_entry: Optional[MarketSnapshot] = None,
        market_confirm: Optional[MarketSnapshot] = None,
        news: Optional[NewsBundle] = None,
    ) -> Optional[XAnalystResult]:
        if not self.is_configured() or not posts:
            return None

        market_ctx = None
        if market_entry and market_entry.status == "ok":
            market_ctx = build_market_context_for_llm(
                market_entry,
                market_confirm,
                news=news,
            )

        user_msg = build_x_analyst_user_message(
            posts,
            symbol=symbol,
            timeframe=self._settings.timeframe,
            confirm_timeframe=self._settings.confirm_timeframe,
            position=position,
            market_context=market_ctx,
        )

        content = openai_json_completion(
            api_key=self._settings.openai_api_key,
            base_url=self._settings.openai_base_url,
            model=self._settings.openai_model,
            system=X_ANALYST_SYSTEM_PROMPT,
            user=user_msg,
            temperature=self._settings.openai_temperature,
            timeout=self._settings.openai_timeout_sec,
        )
        if not content:
            return None

        parsed = _extract_json_object(content)
        if not parsed:
            logger.warning("x_llm_json_parse_failed")
            return None

        try:
            model = XAnalystJson.model_validate(parsed)
        except Exception as e:
            logger.warning("x_llm_validation_failed: %s", e)
            return None

        pos_action = model.resolved_position_action()
        new_dir = model.resolved_new_direction()
        rec = (model.recommended_direction or "none").strip().lower()
        if rec not in ("long", "short", "none"):
            rec = "none"

        conf = model.confidence
        if model.ta_alignment == "against_ta":
            conf = min(conf, 45)
        elif model.ta_alignment == "mixed":
            conf = min(conf, 65)

        return XAnalystResult(
            coins=[c.strip().upper() for c in model.coins if str(c).strip()][:12],
            sentiment=model.sentiment,
            signals=[s.strip() for s in model.signals if str(s).strip()][:8],
            confidence=conf,
            position_action=pos_action,
            reason=model.resolved_reason(),
            recommended_direction=rec if rec != "none" else None,
            new_direction=new_dir,
            ta_alignment=model.ta_alignment,
        )
