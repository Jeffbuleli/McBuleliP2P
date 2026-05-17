# Profils de trader et comportement cible du bot McBuleli

Ce document relie **quatre styles de trading** (timeframe, durée de position, gestion du profit) aux **réglages et règles** que le bot futures doit appliquer pour rester cohérent. Il sert de référence produit pour les prochaines versions (v1.2+).

---

## 1. Pourquoi +20 $ peut retomber à +4 $ (et toucher le SL)

Aujourd’hui, le bot futures UM (`bot-engine-futures.ts`) gère une position ouverte ainsi :

| Mécanisme | Comportement actuel | Effet sur le PnL |
|-----------|---------------------|------------------|
| **Contrôle** | Un passage **cron** (~5 min par défaut, configurable) | Le prix peut retracer fort **entre deux ticks** sans réaction |
| **SL / TP** | Pourcentages **fixes** depuis l’entrée | Le TP lointain n’est pas pris ; le prix revient vers le SL |
| **Smart Exit v1** | Fermeture si **retournement TA** sur 15m/1h/4h + profit min % | Sur un repli rapide, le signal 1h peut rester « favorable » → **pas de sortie** |
| **Pas de trailing** | Aucun SL mobile ni prise de profit partielle | Un pic à +20 $ n’est **pas verrouillé** |

**Diagnostic typique** : la position a été ouverte avec une logique **swing / day** (SL large, TP loin, cron lent), mais le marché a bougé comme en **scalp** (repli violent en quelques minutes). Le bot « apprend » encore à distinguer ces régimes — d’où la nécessité de **profils explicites** ci-dessous.

---

## 2. Les quatre profils (principes marché)

Chaque profil = **cohérence** entre : timeframe d’analyse, fréquence de décision, taille du SL, objectif de gain, et règles de sortie.

```
                    Durée de détention
    Court ◄────────────────────────────────────► Long
         Scalper    Day        Swing      Position
    TF   1m–5m     5m–15m     1h–4h      1D–1W
```

| Profil | Timeframe principal | Tenue typique | Objectif | Erreur fréquente si mal réglé |
|--------|---------------------|---------------|----------|------------------------------|
| **Scalper** | 1m, 3m, 5m | Secondes → &lt; 1 h | Petits %, beaucoup de trades | SL serré + cron lent = SL touché après un pic |
| **Day trader** | 5m, 15m | Minutes → fin de séance | Intraday, pas de carry | Laisser courir un gain sans breakeven → retour flat |
| **Swing trader** | 1h, 4h | 1–10 jours | Mouvements de structure | Smart exit sur 15m qui coupe un swing valide |
| **Position** | 1D, 1W | Semaines | Macro / tendance | Trop de ticks / signaux court terme = sorties prématurées |

---

## 3. Comportement cible du bot par profil

Légende :

- **Aujourd’hui** = faisable avec l’UI et le moteur actuels (v1 + smart exit v1.1).
- **Cible v2** = règles à implémenter pour un bot vraiment autonome et efficace par style.

### 3.1 Scalper

**Principe** : capturer un micro-mouvement ; le edge vient de la **vitesse** et du **SL très court**, pas de la prédiction sur 1h.

| Paramètre | Valeur cible | Aujourd’hui (approx.) | Cible v2 |
|-----------|--------------|------------------------|----------|
| TF entrée | 1m–5m | **1m** (preset scalp) | ✅ `BOT_CANDLE_TIMEFRAMES` inclut 1m/5m |
| TF sortie | 1m–5m (identique) | **5m** smart exit dédié | ✅ preset scalp |
| Cron / tick | 30 s – 1 min | ~5 min par défaut | ✅ alerte UI si scalp + cron &gt; 1 min ; `BOT_CRON_INTERVAL_MS=60000` |
| SL % | 0,3 – 0,8 % | 1–2 % min UI | Profil « scalp » preset |
| TP % | 0,5 – 1,5 % (R:R ≥ 1) | 2–5 % | TP partiel 50 % à 0,8 % |
| Levier | 5–10× (risque maîtrisé) | User | Plafond par profil |
| Smart exit | **ON**, score élevé (50+), profit min **0,2 %** | Réglable | + sortie si temps en position &gt; 15 min |
| Règles clés | Jamais tenir un scalp au SL swing | — | **Breakeven** à +0,4 % ; **trailing** 0,3 % |

**Comportement autonome visé** :

1. N’ouvre que si spread/volatilité OK (filtre marché).
2. Ferme vite sur reversal **15m** ou perte de momentum (pas d’attente 1h).
3. Après +X %, SL → breakeven automatiquement.
4. Un seul trade actif par paire ; pas de ré-entrée avant cooldown 5 min.

**Preset config actuelle (scalp v2)** :

```json
{
  "timeframe": "1m",
  "intervalHours": 1,
  "stopLossPct": 2,
  "takeProfitPct": 4,
  "smartExitMode": true,
  "minReversalScore": 45,
  "minProfitPctForSmartExit": 0.3,
  "smartExitUseEntryTimeframe": false,
  "smartExitTimeframe": "5m",
  "multiTfGateMode": true,
  "confirmTimeframe": "5m"
}
```

---

### 3.2 Day trader (intraday)

**Principe** : suivre la **session** (Europe / US) ; objectif = closure avant impasse overnight ; protéger les gains intraday.

| Paramètre | Valeur cible | Aujourd’hui | Cible v2 |
|-----------|--------------|-------------|----------|
| TF entrée | 15m | 15m ou 1h | 15m + filtre tendance 1h |
| TF sortie | 15m (smart), structure 1h | smart exit 15m dédié | Trailing sur 15m |
| Cron | 1–3 min | ~5 min | 2 min |
| SL % | 1 – 2 % | 2–5 % | ATR-based SL |
| TP % | 2 – 4 % ou sortie signal | 5–10 % | 50 % à TP1, reste trailing |
| Levier | 3–7× | User | — |
| Smart exit | ON, score 40, profit min **0,5 %** | OK | + **max hold** 8 h |
| Règles clés | Sortir si session US close (UTC) | — | Flat forcé EOD option |

**Comportement autonome visé** :

1. Entrée seulement si 15m et 1h **alignés** (smart mode score min 40–45).
2. À **+1 %** unrealized : SL → entry (breakeven).
3. À **+2 %** : trailing stop 0,8 % sous le plus haut (LONG) / au-dessus (SHORT).
4. Smart exit sur **15m** ; ignorer le bruit 1m sauf crash (&gt; 2 % en 5 min → sortie urgence).
5. Pas de nouvelle entrée si drawdown journalier &gt; X % (risk desk).

**Preset config actuelle** :

```json
{
  "timeframe": "15m",
  "intervalHours": 4,
  "stopLossPct": 3,
  "takeProfitPct": 6,
  "smartExitMode": true,
  "minReversalScore": 40,
  "minProfitPctForSmartExit": 0.5,
  "smartExitTimeframe": "15m",
  "smartExitUseEntryTimeframe": false
}
```

*Cas +20 $ → +4 $* : profil **day** avec cron 5 min et **sans breakeven/trailing** = comportement actuel ; le preset ci-dessus réduit le risque via smart exit 15m plus agressif, mais **v2 breakeven** est le vrai correctif.

---

### 3.3 Swing trader

**Principe** : tenir un **swing** dans la tendance 1h–4h ; accepter le bruit 15m ; sortir sur invalidation de structure, pas sur chaque pullback.

| Paramètre | Valeur cible | Aujourd’hui | Cible v2 |
|-----------|--------------|-------------|----------|
| TF entrée | 1h, 4h | 1h ou 4h | 4h bias + 1h trigger |
| TF sortie smart | **4h** ou 1h (pas 15m) | Réglable | Détection structure HH/HL |
| Cron | 5–15 min | ~5 min | OK |
| SL % | 3 – 6 % | 5–8 % | Sous dernier swing |
| TP % | 8 – 15 % ou trailing large | 10–20 % | TP échelonné |
| Levier | 2–5× | User | — |
| Smart exit | ON mais **score 50+**, profit min **1 %** | OK | Désactiver si TF sortie &lt; TF entrée |
| Règles clés | Ne pas couper sur reversal 15m | Risque si exit 15m | Exit uniquement 1h/4h |

**Comportement autonome visé** :

1. Entrée : signal 1h/4h + score ≥ 45.
2. Tant que 4h reste dans le sens du trade : **pas** de smart exit sur 15m.
3. Trailing large (1,5–2 % du pic) après +3 %.
4. SL initial sous support swing ; remontée progressive (pas breakeven à +0,5 %).
5. `intervalHours` 12–24 : pas de ré-entrée tant que position ouverte.

**Preset config actuelle** :

```json
{
  "timeframe": "4h",
  "intervalHours": 24,
  "stopLossPct": 5,
  "takeProfitPct": 12,
  "smartExitMode": true,
  "minReversalScore": 50,
  "minProfitPctForSmartExit": 1,
  "smartExitUseEntryTimeframe": false,
  "smartExitTimeframe": "4h"
}
```

---

### 3.4 Position trader (trend / macro)

**Principe** : peu de trades, forte conviction ; le bot est un **gardien** de tendance, pas un scalpeur.

| Paramètre | Valeur cible | Aujourd’hui | Cible v2 |
|-----------|--------------|-------------|----------|
| TF entrée | 1D (1W) | 4h max | Daily candles |
| TF sortie | 1D | 4h proxy | Weekly structure |
| Cron | 15–60 min | ~5 min | 15 min |
| SL % | 8 – 15 % | Plafond UI 50 % | Volatility stop |
| TP % | 20 %+ ou pas de TP fixe | 20–50 % | Trailing 5 % |
| Levier | 1–3× | User | Hard cap 3× |
| Smart exit | **OFF** ou score 55+ et profit min **3 %** | OFF recommandé | Sortie macro uniquement |
| Règles clés | Ignorer signaux &lt; 4h | Smart 15m dangereux | Alertes seulement |

**Comportement autonome visé** :

1. Une position par symbole ; durée cible plusieurs jours.
2. Pas de smart exit court terme ; SL structure daily.
3. Réduction 25 % de taille à +10 %, pas de close totale avant invalidation daily.
4. Pause trading si funding / événement macro (cible v3).

**Preset config actuelle** :

```json
{
  "timeframe": "4h",
  "intervalHours": 24,
  "stopLossPct": 8,
  "takeProfitPct": 25,
  "smartExitMode": false,
  "smartMode": true,
  "minSignalScore": 50
}
```

---

## 4. Matrice de cohérence (à ne pas mélanger)

|  | Scalper | Day | Swing | Position |
|--|---------|-----|-------|----------|
| TF entrée | ≤ 15m | 15m | 1h–4h | 4h–1D |
| TF smart exit | ≤ entrée | ≤ entrée | ≥ entrée | ≥ 4h |
| Cron | Rapide | Moyen | Lent | Très lent |
| SL | Serré | Moyen | Large | Très large |
| Breakeven rapide | Oui | Oui | Non | Non |
| Trailing | Serré | Moyen | Large | Très large |

**Règle d’or** : *le timeframe de sortie ne doit jamais être plus lent que le style de tenue voulu, ni plus rapide que le style d’entrée.*

Exemple incohérent (cause classique de give-back) :

- Entrée style **swing** (1h, TP 10 %, SL 5 %)
- Sortie effective **scalp** absente (pas de trailing)
- Cron **5 min** + smart exit **1h** → pic +20 $ non protégé, retour vers SL

---

## 5. Roadmap moteur (lien code)

| Fonctionnalité | Profils servis | Fichiers concernés |
|----------------|----------------|-------------------|
| Smart Exit v1.1 (TF sortie dédié) | Day, Swing | `bot-futures-smart-exit.ts`, `bot-futures-config.ts` |
| Cron health | Tous | `bot-cron-health.ts`, `bots-cron-health-bar.tsx` |
| **v1.2 Breakeven SL** ✅ | Scalper, Day | `bot-futures-breakeven.ts`, profils UI |
| **v1.3 Trailing stop** ✅ | Scalper, Day, Swing | `bot-futures-trailing.ts`, profils UI |
| **v1.4 Profil preset UI** ✅ | Tous | `futures-trader-profile-panel.tsx` |
| **v1.5 Multi-TF gate** ✅ | Day, Swing | `multi-tf-gate.ts`, profils UI |
| **v2 Tick rapide / 1m data** ✅ | Scalper | `bot-cron-interval.ts`, `BOT_CANDLE_TIMEFRAMES`, preset scalp 1m |

---

## 6. Choix rapide dans l’UI (recommandation produit)

Ajouter un sélecteur **« Style de trading »** qui applique un preset :

| UI | Preset technique |
|----|------------------|
| Scalp | 1m → 5m MTF, cron 60 s recommandé, SL 2 %, TP 4 %, smart exit 5m |
| Intraday | 15m/1h, smart 15m, profit min 0,5 % |
| Swing | 4h, smart 4h, profit min 1 %, interval 24h |
| Position | 4h, smart off, SL 8 %, TP 25 % |

L’utilisateur peut toujours affiner ; le bot **documente** alors le profil actif dans les logs (`detail.profile: "day"`).

---

## 7. Résumé pour ton cas (+20 $ → +4 $)

1. Identifier le **profil voulu** (sans doute **day** ou **swing**, pas scalp).
2. Aligner **TF entrée**, **TF smart exit**, **SL/TP** et **fréquence cron** sur ce profil (voir matrices).
3. En v1 actuelle : day → preset § 3.2 ; activer smart exit **15m** et baisser `minProfitPctForSmartExit` pour verrouiller plus tôt.
4. En v2 : **breakeven** à +1 % et **trailing** — seuls moyens fiables de ne pas rendre un pic de +20 $.

---

*Dernière mise à jour : `main` — v1.5 multi-TF gate, profils scalp/day/swing avec confirm TF.*
