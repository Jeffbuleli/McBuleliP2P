from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx

from mcbuleli_ai.config.settings import Settings
from mcbuleli_ai.core.schemas import TradingSignal

logger = logging.getLogger(__name__)


class McBuleliBridge:
    """POST AI signal to McBuleli internal API (Phase 2 integration)."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def is_configured(self) -> bool:
        return bool(
            self._settings.mcbuleli_api_url
            and self._settings.mcbuleli_cron_secret
        )

    def submit_signal(
        self,
        signal: TradingSignal,
        instance_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        if not self.is_configured():
            logger.info("mcbuleli_bridge_skip: not configured")
            return None
        iid = (instance_id or self._settings.mcbuleli_instance_id or "").strip()
        if not iid:
            logger.info("mcbuleli_bridge_skip: no instance_id")
            return None
        url = self._settings.mcbuleli_api_url.rstrip("/") + "/api/internal/bots/ai-signal"
        payload = {
            "instanceId": iid,
            "signal": signal.to_dict(),
        }
        headers = {"x-cron-secret": self._settings.mcbuleli_cron_secret}
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload, headers=headers)
                res.raise_for_status()
                return res.json()
        except Exception as e:
            logger.error("mcbuleli_bridge_failed: %s", e)
            return None
