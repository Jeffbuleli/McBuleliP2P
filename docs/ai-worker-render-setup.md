# AI worker on Render — setup checklist

The Python service is **separate** from the McBuleli Web cron. It only pushes analysis to **active Futures** bots with `aiAssistMode`.

## 1. Create Cron Job

| Field | Value |
|--------|--------|
| Type | **Cron Job** |
| Name | `mcbuleli-ai-relay` |
| Root directory | `services/mcbuleli-ai-trading` |
| Build | `pip install -r requirements.txt` |
| Command | `python scripts/relay_all_instances.py` |
| Schedule | `*/1 * * * *` |

Or import `render.yaml` from the repo root.

## 2. Environment variables

| Variable | Value |
|----------|--------|
| `MODE` | `SIGNAL_ONLY` (required) |
| `MCBULELI_API_URL` | `https://www.mcbuleli.online` |
| `MCBULELI_CRON_SECRET` | **Same** as `CRON_SECRET` on the Web service |
| `MCBULELI_INSTANCE_ID` | **Empty** (fan-out to all AI futures bots) |
| `TWITTER_ENABLED` | `1` (optional) |
| `TWITTER_BEARER_TOKEN` | X API bearer |
| `X_LLM_ENABLED` | `1` (optional) |
| `OPENAI_API_KEY` | OpenAI-compatible key |

## 3. Verify

```bash
curl -s -H "x-cron-secret: YOUR_CRON_SECRET" \
  "https://www.mcbuleli.online/api/internal/bots/ai-instances"
```

Expect `instances: [...]` when a Futures bot is **Started** (active).

After one cron run, the app should show a fresh AI strip (age in seconds/minutes, not hours).

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
