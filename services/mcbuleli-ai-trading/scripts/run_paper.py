#!/usr/bin/env python3
"""Continuous paper loop."""
from __future__ import annotations

import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from mcbuleli_ai.core.engine import TradingEngine  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)


def main() -> None:
    TradingEngine().run_forever()


if __name__ == "__main__":
    main()
