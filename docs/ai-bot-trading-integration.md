# McBuleli — AI & Trading Bot Integration

Professional reference for how **Technical Analysis (TA)**, the **McBuleli AI worker**, and the **Trading BOT** cooperate on user-connected exchanges.

## Overview

| Layer | Role | Runtime |
|-------|------|---------|
| **Cron** | Schedules periodic ticks for all active bot instances | Next.js (`/api/internal/bots/tick`) or inline scheduler |
| **TA (in-app)** | OHLCV, indicators, rule-based bias/score, smart gates, position management | TypeScript (`bot-intelligence/`, engines) |
| **AI (external)** | Deeper market read; publishes structured signals per futures instance | Python service → `POST /api/internal/bots/ai-signal` |
| **BOT** | Order placement, SL/TP, breakeven, trailing, smart exit | Binance APIs via encrypted user keys |

Users configure **capital and risk basics** only (pair, size, leverage, SL/TP %, Day/Swing rhythm). **Start** activates TA + AI + BOT together; **Pause** stops new automation.

## Coordinated activation

When a user taps **Start**:

1. Instance `status` → `active` in `bot_instances`.
2. Config is saved with `smartMode: true` and coordinated preset fields (from **Day** or **Swing** profile).
3. Futures configs also set `aiAssistMode: true` so the AI worker targets this instance.
4. Each cron tick runs the plan engine (DCA / Grid / Futures).

There is no separate “enable AI” toggle in the product UI — coordination is intentional.

## Binance.com integration

### Credentials

- Users store **API key + secret** (encrypted) per environment (`demo` / `live`).
- Validation checks **Spot** permissions for DCA/Grid and **Futures (UM)** for `futures_um`.
- Supports **FAPI** (USD-M) and **Portfolio Margin (PAPI)** routing where configured.

### Spot — DCA & Grid

| Plan | Engine | Binance API |
|------|--------|-------------|
| `dca_spot` | `bot-engine-dca.ts` | Spot market/limit buys on interval |
| `grid_spot` | `bot-engine-grid.ts` | Spot orders across a price grid |

**TA gate:** Before buys, `runSmartGate` evaluates signal strength vs `minSignalScore` on the configured timeframe.

### Futures — USD-M

| Step | Component |
|------|-----------|
| Market data | `fetchMarketContext` (CCXT / Binance futures) |
| Open gate | `runSmartGate` / `runMultiTfSmartGate` |
| AI gate | `getAiSignal` + `runAiAssistGate` |
| Open | Binance futures MARKET order |
| Manage | SL/TP, breakeven, trailing, `smartExit` |

**AI requirement (futures):** If `aiAssistMode` is on, a fresh signal must exist in `platform_settings` (`bots_ai:{instanceId}`) with matching side and sufficient confidence.

### Cron

- Default interval: **5 minutes** (`BOT_CRON_INTERVAL_MS`).
- **1 minute** when any active futures bot uses the `scalp` profile (internal; UI exposes Day/Swing only).

## OKX.com integration

OKX plays a **supporting** role in the McBuleli stack:

| Use case | OKX role |
|----------|----------|
| **Pi reference price** | Public candles `PI-USDT` for charts (`/api/market/klines`) |
| **Pi deposit verification** | Private deposit history match by TXID (`lib/okx.ts`, `deposit-verify.ts`) |
| **Automated trading bots** | **Not executed on OKX** — bots trade on **Binance** with user API keys |

Document this clearly to end-users: *Trading automation is Binance-key based; OKX is used for Pi market/deposit operations.*

## AI worker protocol

### 1. Discover targets

`GET /api/internal/bots/ai-instances` (cron secret)

Returns active `futures_um` instances with `aiAssistMode: true`:

- `instanceId`, `billing`, `symbol`, `side`, `timeframe`, `minAiConfidence`

### 2. Publish signal

`POST /api/internal/bots/ai-signal`

```json
{
  "instanceId": "uuid",
  "signal": {
    "action": "LONG" | "SHORT" | "HOLD",
    "confidence": 0-100,
    "risk": "low" | "medium" | "high",
    "reason": "optional summary"
  }
}
```

Stored under `platform_settings` key `bots_ai:{instanceId}`.

### 3. Consumer (futures tick)

`bot-engine-futures.ts`:

- Rejects stale signals (`aiSignalMaxAgeMs`, default 2–3 min per preset).
- Rejects `HOLD`, low confidence, side mismatch, or high risk when configured.
- Opens only when TA gates also pass.

### 4. UI status

`GET /api/trade/bots/ai-status?instanceId=` — polled by the coordination rail on the bots page.

## Presets (Day / Swing)

Presets live in `src/lib/bot-futures-trader-profiles.ts` and are applied via `src/lib/bot-coordinated-config.ts`:

| Preset | Timeframe | Typical hold | AI assist |
|--------|-----------|--------------|-----------|
| **day** | 15m entry, 1h confirm | Hours | On |
| **swing** | 1h entry, 4h confirm | Days | On |

Includes bundled: `minSignalScore`, breakeven/trailing, multi-TF gate, smart exit thresholds.

## Operational checklist

1. **Cron secret** configured; health visible in admin/super-admin bar.
2. **AI worker** deployed (`services/mcbuleli-ai-trading`) with same cron secret.
3. User **valid Binance keys** for the plan (spot and/or futures).
4. User taps **Start** on the desired tab (DCA / Grid / Futures).

## Related files

| Area | Path |
|------|------|
| Coordinated config builder | `src/lib/bot-coordinated-config.ts` |
| Futures engine | `src/lib/bot-engine-futures.ts` |
| AI instances / signals | `src/lib/bot-ai-instances.ts`, `src/lib/bot-ai-signal.ts` |
| TA | `src/lib/bot-intelligence/` |
| Bots UI | `src/components/trade/bots-trading-client.tsx` |
| Python strategies | `services/mcbuleli-ai-trading/` |

---

*McBuleli — coordinated TA + AI + BOT for disciplined automated trading.*
