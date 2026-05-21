# AI worker on Render — setup checklist

The Python service is **separate** from the McBuleli Web cron. It only pushes analysis to **active Futures** bots with `aiAssistMode`.

## 0. Web bot tick (required for orders)

Futures/DCA/Grid **orders** run on `POST /api/internal/bots/tick`. The Python relay does **not** replace this.

Pick **one**:

| Option | Setup |
|--------|--------|
| **A — Inline** | On the **Web** service: `BOT_CRON_INLINE=1`, `CRON_SECRET`, optional `BOT_CRON_INTERVAL_MS=300000` (5 min) |
| **B — Render cron** | Cron `mcbuleli-bots-tick` in `render.yaml`: `node scripts/cron-bots-tick.mjs` every 5 min, `MCBULELI_API_URL` + `CRON_SECRET` |

Without A or B, the UI shows **Cron overdue** (orange tile) and bots do not evaluate trades on schedule.

## 1. Create Cron Job (AI relay)

| Field | Value |
|--------|--------|
| Type | **Cron Job** |
| Name | `mcbuleli-ai-relay` |
| Root directory | `services/mcbuleli-ai-trading` |
| Build | `pip install -r requirements.txt` |
| Command | `python scripts/relay_all_instances.py` |
| Schedule | `*/1 * * * *` |

Or import `render.yaml` from the repo root.

## 2. Environment variables (two separate Cron jobs)

### A — `mcbuleli-bots-tick` (Node — trades / Scheduler)

| Variable | Value |
|----------|--------|
| `MCBULELI_API_URL` | `https://www.mcbuleli.online` |
| `CRON_SECRET` | **Same** as Web `CRON_SECRET` (min 12 chars) |

Do **not** put `PORT`, `MODE`, or OpenAI keys on this job. Logs must show JSON like `{"ok":true,"instances":1,...}` — **not** HTML.

### B — `mcbuleli-ai-relay` (Python — IA / signal X+LLM)

| Variable | Value |
|----------|--------|
| `MODE` | `SIGNAL_ONLY` (**required**) |
| `MCBULELI_API_URL` | `https://www.mcbuleli.online` |
| `MCBULELI_CRON_SECRET` | **Same** as Web `CRON_SECRET` |
| `MCBULELI_INSTANCE_ID` | **Empty** = all active futures bots with AI |
| `TWITTER_ENABLED` | `1` |
| `TWITTER_BEARER_TOKEN` | X API v2 bearer |
| `X_LLM_ENABLED` | `1` |
| `OPENAI_API_KEY` | OpenAI (or compatible) key |
| `SIGNAL_MIN_EDGE` | `15`–`20` (lower = more LONG/SHORT, less HOLD) |

Not needed on Python cron: `CRON_SECRET` (use `MCBULELI_CRON_SECRET`), `PORT`, `INTERVAL_SEC`.

**Do not set** `BINANCE_API_KEY` / `BINANCE_API_SECRET` on `mcbuleli-ai-relay`. In `SIGNAL_ONLY`, OHLCV is **public**; wrong or spot-only keys cause Binance `-2015` and `market_data_degraded`. Trading keys stay in the McBuleli app per bot.

### HOLD + REJECTED in Python logs (normal)

`tick BTCUSDT HOLD conf=0 risk=REJECTED` with `bridge.ok: true` means:

- Analysis ran; **combined score** is between -20 and +20 → no strong direction.
- Signal **HOLD** is still sent to McBuleli (`confidence: 0`).
- The **bot will not open** on HOLD (IA gate + risk).

To see LONG/SHORT, wait for a stronger move or set `SIGNAL_MIN_EDGE=15` and enable X/LLM on Render.

## 3. Verify

```bash
curl -s -H "x-cron-secret: YOUR_CRON_SECRET" \
  "https://www.mcbuleli.online/api/internal/bots/ai-instances"
```

Expect `instances: [...]` when a Futures bot is **Started** (active).

After one cron run, the app should show a fresh AI strip (age in seconds/minutes, not hours).

If the strip shows **IA off** / **9h** in yellow, the Python relay is not running — the bot falls back to **TA only** until the cron is fixed.

**Fallback:** while the bot is active, McBuleli can push a short-lived **TA sync** signal (icon Analysis, not X) so entries are not blocked by a 9h-old worker payload. Full X/LLM analysis still requires `mcbuleli-ai-relay`.

## 4. Local test

```bash
cd services/mcbuleli-ai-trading
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set MODE=SIGNAL_ONLY + MCBULELI_*
python3 scripts/relay_all_instances.py
```

Use `python3` on macOS (not `python`).

## What is NOT the AI worker

| Component | Role |
|-----------|------|
| Web `/api/internal/bots/tick` | Executes DCA, Grid, **and** Futures orders |
| Python `relay_all_instances.py` | Only sends **AI signals** to Futures |

DCA/Grid green “Analysis” tile = in-app TA only, not the Python worker.
