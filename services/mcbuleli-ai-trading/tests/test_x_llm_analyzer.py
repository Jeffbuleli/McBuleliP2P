from mcbuleli_ai.data_layer.x_llm_analyzer import (
    XAnalystJson,
    XAnalystResult,
    _extract_json_object,
)


def test_extract_json_from_markdown_fence():
    raw = '```json\n{"sentiment": "bearish", "confidence": 80}\n```'
    obj = _extract_json_object(raw)
    assert obj["sentiment"] == "bearish"


def test_x_analyst_json_position_action():
    m = XAnalystJson.model_validate(
        {
            "coins": ["BTC"],
            "sentiment": "bearish",
            "confidence": 88,
            "position_action": "close_and_reverse",
            "reason": "Whale selling",
            "new_direction": "short",
        }
    )
    assert m.resolved_position_action() == "close_and_reverse"
    assert m.resolved_new_direction() == "SHORT"


def test_x_analyst_legacy_action_alias():
    m = XAnalystJson.model_validate(
        {
            "sentiment": "bullish",
            "confidence": 80,
            "action": "close_now",
            "reason": "Reversal",
        }
    )
    assert m.resolved_position_action() == "close_now"


def test_opposes_long_on_bearish():
    r = XAnalystResult(
        coins=["BTC"],
        sentiment="bearish",
        signals=[],
        confidence=80.0,
        position_action="close_now",
        reason="FUD",
        recommended_direction=None,
        new_direction=None,
    )
    assert r.opposes_side("LONG") is True
    assert r.opposes_side("SHORT") is False
