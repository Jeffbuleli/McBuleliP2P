from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import List, Optional

import httpx
from pydantic import BaseModel, Field, field_validator

from mcbuleli_ai.config.settings import Settings
from mcbuleli_ai.data_layer.x_analyst_prompt import (
    X_ANALYST_SYSTEM_PROMPT,
    build_x_analyst_user_message,
)

logger = logging.getLogger(__name__)


class XAnalystJson(BaseModel):
    coins: List[str] = Field(default_factory=list)
    sentiment: str = "neutral"
    signals: List[str] = Field(default_factory=list)
    confidence: float = 0.0
    recommended_action: str = "monitor"
    reasoning: str = ""

    @field_validator("sentiment")
    @classmethod
    def normalize_sentiment(cls, v: str) -> str:
        s = (v or "neutral").strip().lower()
        if s in ("bullish", "bearish", "neutral", "volatile"):
            return s
        if "volat" in s or "high-vol" in s:
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
        return max(0.0, min(100.0, n))


@dataclass
class XAnalystResult:
    coins: List[str]
    sentiment: str
    signals: List[str]
    confidence: float
    recommended_action: str
    reasoning: str

    def sentiment_score(self) -> float:
        """Map analyst labels to -1..1 for blending with VADER."""
        base = {
            "bullish": 0.38,
            "bearish": -0.38,
            "neutral": 0.0,
            "volatile": -0.12,
        }.get(self.sentiment, 0.0)
        action = self.recommended_action.lower()
        if "long" in action:
            base += 0.08
        elif "short" in action:
            base -= 0.08
        elif "avoid" in action:
            base *= 0.5
        weight = self.confidence / 100.0
        return max(-1.0, min(1.0, base * (0.35 + 0.65 * weight)))


def _extract_json_object(raw: str) -> Optional[dict]:
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
    """Optional OpenAI-compatible LLM pass over X posts (structured JSON)."""

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
    ) -> Optional[XAnalystResult]:
        if not self.is_configured() or not posts:
            return None

        user_msg = build_x_analyst_user_message(
            posts,
            symbol=symbol,
            timeframe=self._settings.timeframe,
            confirm_timeframe=self._settings.confirm_timeframe,
        )
        base = self._settings.openai_base_url.rstrip("/")
        url = f"{base}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._settings.openai_api_key.strip()}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._settings.openai_model,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": X_ANALYST_SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            "response_format": {"type": "json_object"},
        }

        try:
            with httpx.Client(timeout=45.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code >= 400:
                    logger.warning("x_llm_http_error status=%s body=%s", res.status_code, res.text[:200])
                    return None
                data = res.json()
        except Exception as e:
            logger.warning("x_llm_request_failed: %s", e)
            return None

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            logger.warning("x_llm_bad_response_shape")
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

        coins = [c.strip().upper() for c in model.coins if str(c).strip()][:12]
        signals = [s.strip() for s in model.signals if str(s).strip()][:8]

        return XAnalystResult(
            coins=coins,
            sentiment=model.sentiment,
            signals=signals,
            confidence=model.confidence,
            recommended_action=model.recommended_action.strip() or "monitor",
            reasoning=(model.reasoning or "").strip()[:500],
        )
