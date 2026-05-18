#!/usr/bin/env python3
"""
Continuous multi-instance AI relay (SIGNAL_ONLY).

Use on Render as a Background Worker, or locally:
  python scripts/relay_loop.py
"""
from __future__ import annotations

import logging
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from mcbuleli_ai.config.settings import RunMode, get_settings  # noqa: E402
from mcbuleli_ai.core.engine import TradingEngine  # noqa: E402
SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))
from relay_all_instances import relay_all_once  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> None:
    settings = get_settings()
    if settings.mode != RunMode.SIGNAL_ONLY:
        logger.error("MODE must be SIGNAL_ONLY")
        sys.exit(1)
    if not settings.mcbuleli_api_url or not settings.mcbuleli_cron_secret:
        logger.error("Set MCBULELI_API_URL and MCBULELI_CRON_SECRET")
        sys.exit(1)

    engine = TradingEngine(settings)
    interval = max(30, settings.interval_sec)
    logger.info("relay loop started interval=%ss", interval)

    while True:
        try:
            relay_all_once(settings, engine)
        except Exception as e:
            logger.exception("relay_tick_failed: %s", e)
        time.sleep(interval)


if __name__ == "__main__":
    main()
