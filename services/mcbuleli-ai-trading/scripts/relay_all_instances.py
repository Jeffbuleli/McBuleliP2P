#!/usr/bin/env python3
"""
Relay AI signals to every McBuleli futures bot with aiAssistMode enabled.

Requires MODE=SIGNAL_ONLY, MCBULELI_API_URL, MCBULELI_CRON_SECRET.
Leave MCBULELI_INSTANCE_ID empty to fan out; set it to target one bot only.
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from mcbuleli_ai.config.settings import RunMode, get_settings  # noqa: E402
from mcbuleli_ai.core.engine import TradingEngine  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


def fetch_ai_instances(settings) -> list[dict]:
    url = settings.mcbuleli_api_url.rstrip("/") + "/api/internal/bots/ai-instances"
    headers = {"x-cron-secret": settings.mcbuleli_cron_secret}
    with httpx.Client(timeout=30.0) as client:
        res = client.get(url, headers=headers)
        res.raise_for_status()
        data = res.json()
    return list(data.get("instances") or [])


def main() -> None:
    settings = get_settings()
    if settings.mode != RunMode.SIGNAL_ONLY:
        logger.error("MODE must be SIGNAL_ONLY")
        sys.exit(1)
    if not settings.mcbuleli_api_url or not settings.mcbuleli_cron_secret:
        logger.error("Set MCBULELI_API_URL and MCBULELI_CRON_SECRET")
        sys.exit(1)

    engine = TradingEngine(settings)

    if settings.mcbuleli_instance_id.strip():
        record = engine.tick(instance_id=settings.mcbuleli_instance_id.strip())
        print(json.dumps(record, indent=2, ensure_ascii=False))
        return

    instances = fetch_ai_instances(settings)
    if not instances:
        logger.warning("No active futures bots with aiAssistMode")
        return

    results = []
    for inst in instances:
        iid = inst["instanceId"]
        sym = inst.get("symbol") or settings.symbol
        logger.info("relay %s %s (%s)", iid, sym, inst.get("billing"))
        record = engine.tick(symbol=sym, instance_id=iid)
        results.append(
            {
                "instanceId": iid,
                "symbol": sym,
                "action": record.get("signal", {}).get("action"),
                "bridge": record.get("bridge"),
            }
        )
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
