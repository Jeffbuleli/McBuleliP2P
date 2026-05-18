from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict

from mcbuleli_ai.config.settings import RunMode, Settings
from mcbuleli_ai.core.schemas import RiskDecision, RiskResult, TradeIntent, TradingSignal, utc_now_iso
from mcbuleli_ai.execution.binance_client import BinanceClient
from mcbuleli_ai.execution.mcbuleli_bridge import McBuleliBridge

logger = logging.getLogger(__name__)


class OrderExecutor:
    """Executes only when risk_manager approved. AI never calls this directly."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._binance = BinanceClient(settings)
        self._bridge = McBuleliBridge(settings)
        self._paper_log = Path("logs/paper_trades.jsonl")

    def _append_paper(self, record: Dict[str, Any]) -> None:
        self._paper_log.parent.mkdir(parents=True, exist_ok=True)
        with self._paper_log.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    def execute(
        self,
        signal: TradingSignal,
        intent: TradeIntent,
        risk: RiskResult,
    ) -> Dict[str, Any]:
        if risk.decision not in (RiskDecision.APPROVED, RiskDecision.REDUCED):
            return {"status": "skipped", "reason": risk.reject_codes}

        record: Dict[str, Any] = {
            "ts": utc_now_iso(),
            "mode": self._settings.mode.value,
            "signal": signal.to_dict(),
            "intent": {
                "symbol": intent.symbol,
                "side": intent.side,
                "strategy": intent.strategy.value,
                "margin_usdt": risk.approved_size_usdt,
                "leverage": risk.approved_leverage,
            },
            "risk": {
                "decision": risk.decision.value,
                "codes": risk.reject_codes,
            },
        }

        if self._settings.mode == RunMode.SIGNAL_ONLY:
            bridge_out = self._bridge.submit_signal(signal)
            record["bridge"] = bridge_out
            record["status"] = "signal_only"
            self._append_paper(record)
            return record

        if self._settings.mode == RunMode.PAPER:
            record["status"] = "paper_filled"
            self._append_paper(record)
            logger.info("PAPER trade: %s", json.dumps(record["intent"]))
            return record

        if self._settings.mode == RunMode.LIVE:
            if not self._binance.can_execute_live():
                record["status"] = "live_blocked"
                return record
            # Minimal LIVE path — prefer McBuleli Node for production
            record["status"] = "live_not_implemented_use_mcbuleli"
            return record

        return record
