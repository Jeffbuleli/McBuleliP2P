from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional

from mcbuleli_ai.ai_layer.regime_detector import detect_regime
from mcbuleli_ai.ai_layer.signal_engine import SignalEngine
from mcbuleli_ai.ai_layer.strategy_selector import StrategySelector
from mcbuleli_ai.config.settings import RunMode, Settings, get_settings
from mcbuleli_ai.core.audit import append_audit
from mcbuleli_ai.core.schemas import PortfolioState, StrategyKind, utc_now_iso
from mcbuleli_ai.data_layer.market_data import MarketDataService
from mcbuleli_ai.data_layer.news_data import NewsDataService
from mcbuleli_ai.execution.order_executor import OrderExecutor
from mcbuleli_ai.risk_management.risk_manager import RiskManager, risk_config_from_settings
from mcbuleli_ai.strategies.dca_strategy import DcaStrategy
from mcbuleli_ai.strategies.futures_strategy import FuturesStrategy
from mcbuleli_ai.strategies.grid_strategy import GridStrategy

logger = logging.getLogger(__name__)


def _analysis_summary(signal, regime: str, reject_codes: list, min_edge: int) -> dict:
    edge = min_edge
    cs = signal.combined_score
    hint = ""
    if signal.action.value == "HOLD":
        if abs(cs) < edge:
            hint = (
                f"Score combiné {cs} entre -{edge} et +{edge} → HOLD (pas assez de conviction). "
                f"Régime marché={regime} peut diverger du signal court terme."
            )
        else:
            hint = "HOLD malgré score élevé — vérifier dégradation données."
    elif "HOLD_SIGNAL" in reject_codes:
        hint = "Risk a bloqué car action=HOLD — normal, pas d'ordre."
    return {
        "technical_score": signal.technical_score,
        "combined_score": cs,
        "sentiment_score": signal.sentiment_score,
        "min_edge_required": edge,
        "hold_hint": hint,
    }


class TradingEngine:
    """
    Main loop: data → TA + news/sentiment → signal → strategy → risk → executor.
    AI never trades without risk approval.
    """

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self._settings = settings or get_settings()
        self._market = MarketDataService(self._settings)
        self._news = NewsDataService(self._settings)
        self._signal_engine = SignalEngine()
        self._selector = StrategySelector()
        self._risk = RiskManager(risk_config_from_settings(self._settings))
        self._futures = FuturesStrategy()
        self._grid = GridStrategy()
        self._dca = DcaStrategy()
        self._executor = OrderExecutor(self._settings)
        self._portfolio = PortfolioState()

    def tick(
        self,
        *,
        symbol: Optional[str] = None,
        instance_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        from mcbuleli_ai.utils.symbols import to_ccxt_futures_symbol

        ts = utc_now_iso()
        sym = to_ccxt_futures_symbol(symbol or self._settings.symbol)
        market = self._market.refresh(sym, self._settings.timeframe)
        confirm = self._market.refresh(sym, self._settings.confirm_timeframe)
        news = self._news.fetch_all()

        signal = self._signal_engine.run(
            market, news, confirm, min_edge=self._settings.signal_min_edge
        )
        regime = detect_regime(market, news)
        selection = self._selector.select(signal, regime)

        intent = None
        if selection.strategy == StrategyKind.FUTURES:
            intent = self._futures.build_intent(signal, selection)
        elif selection.strategy == StrategyKind.GRID:
            intent = self._grid.build_intent(signal, selection)
        elif selection.strategy == StrategyKind.DCA:
            intent = self._dca.build_intent(signal, selection)

        risk = self._risk.approve(signal, intent, self._portfolio, selection)

        exec_out: Dict[str, Any] = {}
        if intent and risk.decision.value in ("APPROVED", "REDUCED"):
            exec_out = self._executor.execute(signal, intent, risk)

        bridge_out: Optional[Dict[str, Any]] = None
        if self._settings.mode == RunMode.SIGNAL_ONLY:
            bridge_out = self._executor.relay_signal(
                signal,
                instance_id=instance_id or self._settings.mcbuleli_instance_id or None,
            )

        record = {
            "ts": ts,
            "signal": signal.to_dict(),
            "regime": regime.regime.value,
            "regime_reason": regime.reason,
            "selection": {
                "strategy": selection.strategy.value,
                "reason": selection.selector_reason,
                "pause": selection.pause_trading,
            },
            "risk": {
                "decision": risk.decision.value,
                "approved_size_usdt": risk.approved_size_usdt,
                "approved_leverage": risk.approved_leverage,
                "reject_codes": risk.reject_codes,
                "reject_reasons": risk.reject_reasons,
            },
            "execution": exec_out,
            "bridge": bridge_out,
            "news_headline_count": len(news.headlines),
            "news_x_enabled": self._settings.twitter_enabled,
            "news_x_llm": news.sentiment.x_llm_used,
            "news_x_posts": news.sentiment.x_post_count,
            "analysis": _analysis_summary(
                signal,
                regime.regime.value,
                risk.reject_codes,
                self._settings.signal_min_edge,
            ),
        }

        append_audit(self._settings.log_jsonl_path, record)
        logger.info(
            "tick %s %s conf=%s risk=%s",
            signal.symbol,
            signal.action.value,
            signal.confidence,
            risk.decision.value,
        )
        return record

    def run_forever(self) -> None:
        logger.info(
            "McBuleli AI engine started mode=%s interval=%ss",
            self._settings.mode.value,
            self._settings.interval_sec,
        )
        while True:
            try:
                self.tick()
            except Exception as e:
                logger.exception("tick_failed: %s", e)
            time.sleep(max(5, self._settings.interval_sec))
