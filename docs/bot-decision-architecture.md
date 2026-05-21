# Architecture décisionnelle McBuleli (quant 4 couches)

## Priorité

```
Technical → Risk → AI (modulateur) → Execution
```

L’IA **ne veto pas** un setup technique fort. Elle réduit levier / taille sauf **événement majeur** (macro, crash, hack).

## Couches (Node — production orders)

| Plan | Orchestrateur | AI |
|------|---------------|-----|
| **Futures UM** | `runFuturesDecisionOrchestrator` | Modulateur GPT/X |
| **DCA Spot** | `runSpotDecisionOrchestrator` | — |
| **Grid Spot** | `runSpotDecisionOrchestrator` | — |

| Couche | Module | Rôle |
|--------|--------|------|
| 1 Technical | `technical-engine.ts` | Direction / score lissé (EMA α≈0.38), MTF |
| 2 Risk | `risk-engine.ts` | Taille, levier (futures) ou quote (spot) |
| 3 AI | `ai-sentiment-engine.ts` | Futures uniquement — `blocking_event` rare |
| 4 Execution | `bot-engine-*.ts` + `execution-engine.ts` | Ordres Binance + codes erreur |

## Traçabilité « Ignoré »

Chaque refus produit un `IgnoredSignalTrace` loggé en `decision_skip` :

```json
{
  "signal_id": "uuid",
  "signal": "LONG",
  "score": 44,
  "status": "IGNORED",
  "category": "TECHNICAL",
  "reason_code": "TREND_CONFLICT",
  "reason_message": "4H trend still bearish…",
  "timestamp": "…",
  "debug": {}
}
```

UI : **Ignoré → TREND_CONFLICT** (couleur par catégorie).

## Codes raison

Voir `src/lib/bot-decision/reason-codes.ts` (TECHNICAL, AI, RISK, EXECUTION, SYSTEM).

## Worker Python

- `mcbuleli_ai/decision/` — lissage score, modulateur IA
- `signal_engine.score_to_action` — anti-paralysis si \|technical\| ≥ 35
- Relay inchangé : `POST /api/internal/bots/ai-signal`

## Réglages anti-paralysie

- Baisser `minSignalScore` (ex. 28–35) si trop de `LOW_SCORE`
- `minAiConfidence` 22–28 : l’IA module sans bloquer
- Score lissé stocké : `platform_settings` `bots_tech_smooth:{instanceId}`
