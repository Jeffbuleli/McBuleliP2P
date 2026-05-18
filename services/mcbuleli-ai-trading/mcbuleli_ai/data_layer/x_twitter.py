from __future__ import annotations

import logging
from typing import List, Tuple

import httpx

from mcbuleli_ai.config.settings import Settings

logger = logging.getLogger(__name__)

SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"


class XTwitterClient:
    """
    X (Twitter) API v2 — recent search with Bearer token.
    Keys from developer portal:
      - API Key = Consumer Key
      - API Secret = Consumer Secret
      - Bearer Token = app-only read (recommended for sentiment)
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def is_configured(self) -> bool:
        return bool(self._settings.twitter_enabled and self._settings.twitter_bearer_token.strip())

    def fetch_posts(self) -> Tuple[List[str], List[str]]:
        if not self.is_configured():
            return [], []

        symbol = self._settings.symbol.replace("/", " ").replace(":USDT", "").strip()
        base = symbol.split()[0] if symbol else "BTC"
        query = self._settings.twitter_search_query or (
            f"({base} OR bitcoin OR crypto) -is:retweet lang:en"
        )
        max_results = min(100, max(10, self._settings.twitter_max_posts))

        headers = {
            "Authorization": f"Bearer {self._settings.twitter_bearer_token.strip()}",
        }
        params = {
            "query": query,
            "max_results": str(max_results),
            "tweet.fields": "created_at,lang",
        }

        try:
            with httpx.Client(timeout=25.0) as client:
                res = client.get(SEARCH_URL, headers=headers, params=params)
                if res.status_code == 401:
                    logger.error("twitter_auth_failed: check TWITTER_BEARER_TOKEN")
                    return [], []
                if res.status_code == 429:
                    logger.warning("twitter_rate_limited")
                    return [], []
                res.raise_for_status()
                data = res.json()
        except Exception as e:
            logger.warning("twitter_fetch_failed: %s", e)
            return [], []

        texts: List[str] = []
        sources: List[str] = []
        for item in data.get("data") or []:
            text = (item.get("text") or "").strip()
            if len(text) < 12:
                continue
            texts.append(text[:280])
            sources.append("x.com")

        logger.info("twitter_fetched %d posts", len(texts))
        return texts, sources
