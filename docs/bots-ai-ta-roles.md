# Bots — rôles TA, IA et exécution (sans conflit)

Pipeline détaillé (indicateurs, GPT-5.5, scores) : [market-analysis-pipeline.md](./market-analysis-pipeline.md).

Architecture 4 couches + codes « Ignoré » : [bot-decision-architecture.md](./bot-decision-architecture.md).

## Qui fait quoi

| Couche | Où | Rôle | Ne fait pas |
|--------|-----|------|-------------|
| **Cron tick** | Render `mcbuleli-bots-tick` / Node | Déclenche l’évaluation du bot toutes les 5 min | Analyse X, score combiné worker |
| **TA (Smart)** | App Next.js, chandeliers Binance | « Le marché permet-il une entrée ? » (`minSignalScore`, ex. 38–40) | Ordres, sentiment X |
| **IA worker** | Python `mcbuleli-ai-relay` | Avis directionnel (LONG/SHORT/HOLD) + X/LLM → `combined_score` | Ordres, remplace la TA |
| **IA gate** | App `runAiAssistGate` | Si `aiAssistMode` : valide que l’avis IA **accompagne** le sens du bot (LONG/SHORT) | Recalculer les chandeliers |
| **TA sync** | App `refreshAiSignalFromTaIfStale` | Si le worker est absent/stale : copie l’avis TA dans le bandeau IA (affichage + gate) | Remplace le worker quand il est frais |
| **Exécution** | `bot-engine-futures` | Ordre Binance si **toutes** les étapes OK | Décider seul sur un tweet |

## Ordre des filtres (Futures, entrée)

```
1. Bot actif + clés API OK
2. Pas de position ouverte (selon règles)
3. interval_not_elapsed (ex. Swing 24 h depuis dernier futures_open)
4. reentry_cooldown
5. smart_blocked  ← TA seule (score < minSignalScore)
6. refreshAiSignalFromTaIfStale (si relay mort)
7. ai_signal_*     ← IA seulement si aiAssistMode (après TA OK)
8. Ordre Binance
```

**Important :** une hausse « visible » sur X ou un `combined_score` à +10 ne suffit pas si l’étape 5 ou 7 bloque.

## Pourquoi « BULLISH » mais pas de trade

| Symptôme | Cause typique | Log / skip |
|----------|---------------|------------|
| Marché haussier court terme, pas d’ordre | Worker `HOLD` (score entre -15 et +15) | `ai_signal_hold` |
| Relay OK, score +18, bot LONG | `minAiConfidence` trop haut (40) vs confiance réelle ~18 | `ai_low_confidence` |
| Score TA 38, seuil 40 | TA refuse avant l’IA | `smart_blocked` |
| Swing, pas d’entrée depuis 24 h | Normal si déjà entré récemment | `interval_not_elapsed` |
| Régime `TREND_DOWN`, score faible | IA prudente, pas contradiction TA | `HOLD` dans JSON relay |

## Alignement worker ↔ app

Sur Render, `SIGNAL_MIN_EDGE=15` → LONG si `combined_score ≥ 15`, confiance ≈ `|score|`.

L’app utilise `minAiConfidence` (souvent 40) : même avec `LONG` et score 20, le gate IA refusait.

**Correctif :** confiance effective = `max(confidence, |combined_score|)` et seuils profil abaissés (~22–28). HOLD peut passer en **soft align** si le score est du bon côté et ≥ 15.

## Réglages conseillés

| Variable Render (Python) | Effet |
|--------------------------|--------|
| `SIGNAL_MIN_EDGE=15` | Plus de LONG/SHORT, moins de HOLD |

| Paramètre bot (app) | Effet |
|---------------------|--------|
| `minSignalScore` 35–38 | TA moins stricte |
| `minAiConfidence` 20–28 | Aligné avec le worker |
| `aiAssistMode` off | Seule la TA décide (pas de double filtre IA) |
| `intervalHours` | Fréquence max des entrées Swing |

## Fichiers

- TA : `src/lib/bot-intelligence/`, `src/lib/bot-engine-futures.ts`
- IA gate : `src/lib/bot-ai-signal.ts`
- TA sync : `src/lib/bot-ai-ta-fallback.ts`
- Worker : `services/mcbuleli-ai-trading/mcbuleli_ai/`
