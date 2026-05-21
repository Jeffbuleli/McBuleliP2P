"""OpenAI Chat Completions + Responses API (GPT-5.x)."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)


def uses_responses_api(model: str) -> bool:
    m = (model or "").strip().lower()
    return m.startswith("gpt-5") or m.startswith("o3") or m.startswith("o4")


def _extract_text_from_responses(data: Dict[str, Any]) -> Optional[str]:
    if isinstance(data.get("output_text"), str) and data["output_text"].strip():
        return data["output_text"]
    output = data.get("output")
    if isinstance(output, list):
        chunks: list[str] = []
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "output_text":
                        t = part.get("text")
                        if isinstance(t, str):
                            chunks.append(t)
        if chunks:
            return "".join(chunks)
    return None


def openai_json_completion(
    *,
    api_key: str,
    base_url: str,
    model: str,
    system: str,
    user: str,
    temperature: float = 0.1,
    timeout: float = 90.0,
) -> Optional[str]:
    key = api_key.strip()
    if not key:
        return None
    base = base_url.rstrip("/")
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    if uses_responses_api(model):
        url = f"{base}/responses"
        payload: Dict[str, Any] = {
            "model": model,
            "instructions": system,
            "input": user,
            "temperature": temperature,
            "text": {"format": {"type": "json_object"}},
        }
        try:
            with httpx.Client(timeout=timeout) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code >= 400:
                    logger.warning(
                        "openai_responses_error status=%s body=%s",
                        res.status_code,
                        res.text[:300],
                    )
                    return None
                text = _extract_text_from_responses(res.json())
                if text:
                    return text
                logger.warning("openai_responses_empty_output")
        except Exception as e:
            logger.warning("openai_responses_failed: %s", e)

    url = f"{base}/chat/completions"
    payload = {
        "model": model,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {"type": "json_object"},
    }
    try:
        with httpx.Client(timeout=timeout) as client:
            res = client.post(url, headers=headers, json=payload)
            if res.status_code >= 400:
                logger.warning(
                    "openai_chat_error status=%s body=%s",
                    res.status_code,
                    res.text[:300],
                )
                return None
            data = res.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning("openai_chat_failed: %s", e)
    return None
