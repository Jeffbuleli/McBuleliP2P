from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List
from urllib.parse import urlparse

import feedparser

from mcbuleli_ai.config.settings import Settings
from mcbuleli_ai.data_layer.sentiment_analyzer import SentimentAnalyzer, SentimentResult
from mcbuleli_ai.data_layer.x_twitter import XTwitterClient

logger = logging.getLogger(__name__)

# Public RSS / headlines — no Twitter API required for MVP.
# Phase 2: CryptoPanic, LunarCrush, or curated X/Telegram via official APIs.


@dataclass
class NewsBundle:
    headlines: List[str] = field(default_factory=list)
    sources: List[str] = field(default_factory=list)
    sentiment: SentimentResult = field(
        default_factory=lambda: SentimentResult(0.0, 0.0, 0, False, False, [])
    )


class NewsDataService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._analyzer = SentimentAnalyzer()

    def fetch_all(self) -> NewsBundle:
        """RSS + optional X/Twitter recent search."""
        headlines: List[str] = []
        sources: List[str] = []
        max_n = self._settings.news_max_headlines

        if self._settings.twitter_enabled:
            x_client = XTwitterClient(self._settings)
            x_texts, x_sources = x_client.fetch_posts()
            for t, s in zip(x_texts, x_sources):
                headlines.append(t)
                sources.append(s)

        for url in self._settings.rss_url_list():
            try:
                feed = feedparser.parse(url)
                host = urlparse(url).netloc or url
                for entry in feed.entries[: max_n // 2]:
                    title = (entry.get("title") or "").strip()
                    summary = (entry.get("summary") or "").strip()
                    if title:
                        headlines.append(title)
                        sources.append(host)
                    if summary and len(summary) < 300:
                        headlines.append(summary[:300])
                        sources.append(host)
            except Exception as e:
                logger.warning("rss_fetch_failed %s: %s", url, e)

        headlines = headlines[:max_n]
        sentiment = self._analyzer.analyze_headlines(headlines)
        return NewsBundle(headlines=headlines, sources=sources, sentiment=sentiment)

    def fetch_rss_headlines(self) -> NewsBundle:
        return self.fetch_all()
