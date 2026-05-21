from mcbuleli_ai.data_layer.x_llm_analyzer import (
    XAnalystJson,
    XAnalystResult,
    _extract_json_object,
)


def test_extract_json_from_markdown_fence():
    raw = '```json\n{"sentiment": "bullish", "confidence": 80}\n```'
    obj = _extract_json_object(raw)
    assert obj["sentiment"] == "bullish"


def test_x_analyst_json_normalizes_sentiment():
    m = XAnalystJson.model_validate(
        {
            "coins": ["BTC", "ETH"],
            "sentiment": "High-Volatility",
            "signals": ["Whale inflow"],
            "confidence": 150,
            "recommended_action": "long bias",
            "reasoning": "Strong bid.",
        }
    )
    assert m.sentiment == "volatile"
    assert m.confidence == 100.0


def test_sentiment_score_long_bias():
    r = XAnalystResult(
        coins=["BTC"],
        sentiment="bullish",
        signals=["ETF flow"],
        confidence=70.0,
        recommended_action="long bias",
        reasoning="Momentum.",
    )
    assert r.sentiment_score() > 0.2
