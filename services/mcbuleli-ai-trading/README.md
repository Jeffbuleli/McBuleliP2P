# McBuleli AI Trading

Python **decision layer** for McBuleliP2P: technical analysis (RSI, EMA, SMA, MACD, **Ichimoku**, **Fibonacci**, ATR, order book, funding) combined with **news / rumor sentiment** (RSS + VADER + keyword rules).

**Production rule:** AI does not trade directly. Flow:

```
market + news → signal_engine → strategy_selector → risk_manager → executor
```

McBuleli Node (`src/lib/bot-engine-*.ts`) remains the execution authority for demo/live users.

## Requirements

- Python **3.8+** (3.11+ recommended)
- Internet (Binance public API + RSS feeds)

## Setup

```bash
cd services/mcbuleli-ai-trading
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Run (paper)

One tick:

```bash
python scripts/run_once.py
```

Continuous loop (default 60s):

```bash
python scripts/run_paper.py
```

Logs: `logs/decisions.jsonl`, paper fills: `logs/paper_trades.jsonl`

## Modes

| MODE | Behavior |
|------|----------|
| `PAPER` | Log simulated fills only |
| `SIGNAL_ONLY` | Log + optional POST to McBuleli (`MCBULELI_API_URL`) |
| `LIVE` | Disabled by default — use McBuleli Node for real orders |

Set `EMERGENCY_STOP=1` to pause all new risk.

## Signal schema (v1)

```json
{
  "version": 1,
  "symbol": "BTCUSDT",
  "action": "LONG",
  "confidence": 72,
  "strategy": "FUTURES",
  "risk_level": "MEDIUM",
  "timeframe": "15m",
  "technical_score": 48,
  "sentiment_score": 0.12,
  "reasons": ["EMA trend up", "Ichimoku above cloud"],
  "ts": "2026-05-18T12:00:00Z"
}
```

## X (Twitter) sentiment

In `.env`:

```env
TWITTER_ENABLED=1
TWITTER_BEARER_TOKEN=your_bearer_token
```

Uses API v2 `search/recent` (public posts). API Key / Secret are stored for future OAuth; **Bearer is required** for read.

## Understanding HOLD + REJECTED

Normal output when the edge is not strong enough:

- **Regime** `TREND_DOWN` = structure 1h/15m bearish (EMA + Ichimoku).
- **Action** `HOLD` = combined score between `-SIGNAL_MIN_EDGE` and `+SIGNAL_MIN_EDGE` (default ±20).
- **Risk** `REJECTED` / `HOLD_SIGNAL` = risk gate blocks entries on HOLD (by design).

Check `analysis.combined_score` and `analysis.hold_hint` in JSON. To trade more often (less safe), try `SIGNAL_MIN_EDGE=15`.

## McBuleli integration (Phase 2)

Configure:

```env
MODE=SIGNAL_ONLY
MCBULELI_API_URL=https://www.mcbuleli.online
MCBULELI_CRON_SECRET=...
MCBULELI_INSTANCE_ID=...
```

Node stores signals via `POST /api/internal/bots/ai-signal` (`x-cron-secret`). When `aiAssistMode` is on in the futures bot config, `bot-engine-futures` applies `runAiAssistGate` after the smart gate (scalp/day presets enable it by default).

## Tests

```bash
pytest tests/ -q
```

## Parity with TypeScript

Technical scoring mirrors `src/lib/bot-intelligence/evaluate-signal.ts` plus MACD. Indicators mirror `compute-indicators.ts` (Ichimoku 9/26/52, Fib 38.2/50/61.8).
