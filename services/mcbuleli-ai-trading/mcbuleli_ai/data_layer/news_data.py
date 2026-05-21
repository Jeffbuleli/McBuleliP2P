from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import List, Optional
from urllib.parse import urlparse

import feedparser

from mcbuleli_ai.config.settings import Settings
from mcbuleli_ai.data_layer.sentiment_analyzer import SentimentAnalyzer, SentimentResult
from mcbuleli_ai.data_layer.x_analyst_prompt import XPositionContext
from mcbuleli_ai.data_layer.x_llm_analyzer import XLLMAnalyzer
from mcbuleli_ai.data_layer.x_twitter import XTwitterClient
from mcbuleli_ai.utils.symbols import normalize_binance_symbol

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
        self._position_ctx: Optional[XPositionContext] = None

    def set_position_context(self, ctx: Optional[XPositionContext]) -> None:
        self._position_ctx = ctx

    def fetch_all(self) -> NewsBundle:
        """RSS + optional X/Twitter recent search (+ optional LLM analyst)."""
        headlines: List[str] = []
        sources: List[str] = []
        x_posts: List[str] = []
        max_n = self._settings.news_max_headlines

        if self._settings.twitter_enabled:
            x_client = XTwitterClient(self._settings)
            x_texts, x_sources = x_client.fetch_posts()
            x_posts = list(x_texts)
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
        sentiment = self._maybe_blend_x_llm(sentiment, x_posts)
        return NewsBundle(headlines=headlines, sources=sources, sentiment=sentiment)

    def _maybe_blend_x_llm(
        self, base: SentimentResult, x_posts: List[str]
    ) -> SentimentResult:
        if not x_posts:
            return base

        llm = XLLMAnalyzer(self._settings)
        if not llm.is_configured():
            return SentimentResult(
                score=base.score,
                compound=base.compound,
                headline_count=base.headline_count,
                volatility_flag=base.volatility_flag,
                rumor_flag=base.rumor_flag,
                top_themes=base.top_themes,
                x_post_count=len(x_posts),
            )

        symbol = normalize_binance_symbol(self._settings.symbol)
        analysis = llm.analyze_posts(
            x_posts,
            symbol=symbol,
            position=self._position_ctx,
        )
        if not analysis:
            return SentimentResult(
                score=base.score,
                compound=base.compound,
                headline_count=base.headline_count,
                volatility_flag=base.volatility_flag,
                rumor_flag=base.rumor_flag,
                top_themes=base.top_themes,
                x_post_count=len(x_posts),
            )

        w = max(0.0, min(1.0, self._settings.x_llm_blend_weight))
        llm_score = analysis.sentiment_score()
        blended = (1.0 - w) * base.score + w * llm_score
        volatile = base.volatility_flag or analysis.sentiment == "volatile"
        if analysis.position_action in ("close_now", "close_and_reverse"):
            blended = analysis.sentiment_score()
            volatile = True

        themes = list(base.top_themes)
        for sig in analysis.signals[:4]:
            themes.append(f"x:{sig[:48]}")
        if analysis.coins:
            themes.append("x:coins=" + ",".join(analysis.coins[:5]))

        return SentimentResult(
            score=max(-1.0, min(1.0, blended)),
            compound=blended,
            headline_count=base.headline_count,
            volatility_flag=volatile,
            rumor_flag=base.rumor_flag,
            top_themes=list(dict.fromkeys(themes))[:10],
            x_post_count=len(x_posts),
            x_llm_used=True,
            x_sentiment=analysis.sentiment,
            x_recommended_action=analysis.recommended_direction,
            x_confidence=analysis.confidence,
            x_position_action=analysis.position_action,
            x_new_direction=analysis.new_direction,
            x_reason=analysis.reason,
        )

    def fetch_rss_headlines(self) -> NewsBundle:
        return self.fetch_all()
