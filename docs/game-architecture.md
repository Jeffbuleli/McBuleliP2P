# McBuleli Congo Mining — Game Architecture (MVP)

Mobile-first mining simulator integrated with McBuleli Community. Lightweight web MVP; Godot 4 client planned.

## Core Loop

```
Mine (risk) → Stock (purity) → Sell local OR Transport (strategy) → McB revenue → Upgrades → Unlock zones/vehicles
```

## Currency Roles

| Token | Role | Sources | Spends |
|-------|------|---------|--------|
| **McB** | Premium in-game utility | Mineral sales, transport rewards (capped variance) | Tools, fuel, maintenance, licenses, upgrades |
| **BP** | Community soft currency | Engagement on McBuleli.org | Energy refill, beginner tool repair, market tips only |
| **XP** | Career progression (not currency) | Mining, transport, trade | Unlocks vehicles, roles, zones, licenses |

McB is **not** infinite farm reward — transport and sales depend on market prices, purity, and operating costs.

## Risk Systems (`risk-engine.ts`)

Extraction rolls four outcomes:

- **failed** — no yield, tool wear, small XP
- **partial** — low-grade batch (low purity/yield)
- **success** — normal yield
- **rich_strike** — high-risk sites only, bonus yield/purity

Site risk = f(richness, mineral difficulty, rarity). Rich + dangerous vs safe + low-profit emerges naturally.

Tool durability (0–100) stored in `game_players.stats.toolDurability`. Low durability increases fail chance.

## Mineral Purity

Each stock row has blended `purityPct`. Affects:

- `purityPriceMultiplier()` on sell and transport reward
- Transport risk (high purity slightly reduces risk)
- UI grade: Premium / Standard / Low / Waste

## Transport (`transport-engine.ts`)

Strategic loop:

1. Choose **vehicle** (XP-gated: bicycle → motorcycle → pickup → truck → fleet)
2. Choose **route** (distance, base risk, mud sensitivity)
3. Preview **quote**: fuel + maintenance McB, risk %, duration, estimated reward
4. Pay McB + energy → job enters `game_transport_jobs`
5. Cron tick completes or fails based on `riskFactor`

Weather events (rain, fuel spike) increase mud multiplier → higher cost, delay, risk.

## XP Progression (`progression.ts`)

Lifestyle stages: starter → rising → operator → mogul (visual gear emoji + labels).

Role ladder: artisanal_miner → … → mining_corporation. Each role has `minXp` gate.

Unlocks at XP thresholds: motorcycle routes (120), pickup (400), trader licenses (900), depot (1800).

## World Dynamics

`runEconomyTick()` (cron):

- Price volatility per mineral
- Random world events (demand surges, rain, export slowdown)
- Transport job completion/failure

Events surface in market API and UI news ticker.

## API Surface

| Endpoint | Purpose |
|----------|---------|
| `GET /api/game/player` | Full dashboard + progression |
| `GET /api/game/market` | Prices + active events |
| `POST /api/game/mining` | Extract at site (risk outcome) |
| `GET /api/game/transport/quote` | Transport estimate |
| `POST /api/game/transport` | Start transport job |
| `POST /api/game/trade` | Sell minerals locally |
| `POST /api/game/boost` | Spend BP on small boosts |
| `POST /api/game/advisor` | BULELI AI advisor |
| `POST /api/internal/game/tick` | Economy cron |

## Database

15 tables in `src/db/game-schema.ts`, migration `drizzle/0076_game_schema.sql`. Bootstrap via `ensureGameSchema()` on first access.

## MVP Roadmap

### Phase 1 (current)
- Risk extraction, purity, transport quotes, XP progression UI
- McB/BP separation, world events ticker
- BULELI AI advisor

### Phase 2
- Role promotion flow (McB entry fees)
- Upgrade shop UI wired to `UPGRADE_CATALOG`
- Refinery / purity upgrade action

### Phase 3
- Godot 4 client via same API + Nakama stub
- Regional map (Katanga, Kivu, Kasai, Lualaba)
- Persistent vehicle durability in `game_vehicles`

### Phase 4
- Multiplayer depots / co-op transport (Nakama)
- On-chain McB settlement (optional, not MVP)

## Design Principles

1. Gameplay loop stability first
2. Economic balancing (McB sinks > faucets at scale)
3. Risk vs reward on every extraction and route
4. Progression addiction via XP unlocks + lifestyle visuals
5. African mining identity — earthy palette, Katanga/Lubumbashi context, no sci-fi UI
