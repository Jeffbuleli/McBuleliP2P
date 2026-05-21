from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class RunMode(str, Enum):
    PAPER = "PAPER"
    SIGNAL_ONLY = "SIGNAL_ONLY"
    LIVE = "LIVE"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mode: RunMode = RunMode.PAPER
    symbol: str = "BTC/USDT:USDT"
    timeframe: str = "15m"
    confirm_timeframe: str = "1h"
    interval_sec: int = 60

    binance_api_key: str = ""
    binance_api_secret: str = ""
    binance_testnet: bool = False

    max_leverage: int = 10
    max_risk_pct: float = 2.0
    max_daily_drawdown_pct: float = 5.0
    max_positions: int = 1
    min_confidence: int = 40
    emergency_stop: bool = False

    news_rss_urls: str = (
        "https://www.coindesk.com/arc/outboundfeeds/rss/,"
        "https://cointelegraph.com/rss"
    )
    news_max_headlines: int = 40
    sentiment_pause_threshold: float = -0.45
    volatility_pause_atr_pct: float = 3.5

    # X (Twitter) API v2 — Bearer token required for search
    twitter_enabled: bool = False
    twitter_bearer_token: str = ""
    twitter_api_key: str = ""
    twitter_api_secret: str = ""
    twitter_search_query: str = ""
    twitter_max_posts: int = 25

    # X posts → OpenAI-compatible LLM (structured analyst JSON)
    x_llm_enabled: bool = False
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    x_llm_blend_weight: float = 0.45

    # Signal: |combined_score| must exceed this for LONG/SHORT (else HOLD)
    signal_min_edge: int = 20

    mcbuleli_api_url: str = ""
    mcbuleli_cron_secret: str = ""
    mcbuleli_instance_id: str = ""

    log_jsonl_path: str = "logs/decisions.jsonl"

    def rss_url_list(self) -> List[str]:
        return [u.strip() for u in self.news_rss_urls.split(",") if u.strip()]


def get_settings() -> Settings:
    return Settings()
