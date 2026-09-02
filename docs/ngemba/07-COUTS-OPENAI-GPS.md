# OpenAI vs GPS - couts NGEMBA

## Reponse courte

| Fonction | Service | Credits OpenAI ? |
|----------|---------|------------------|
| GPS / reverse geocode | Navigateur + **Geoapify** (comme SafeFind) ou communes offline | **Non** |
| Choix commune Kinshasa | Liste locale | **Non** |
| Triage alerte (comprendre le recit) | McBuleli IA / **OpenAI** ou regles locales | **Oui** seulement si mode openai/hybrid appelle l'API |
| Dashboard ONG | App interne | Non |

**Le GPS ne consomme jamais de credits OpenAI.**

---

## Modes IA (`NGEMBA_AI_MODE`)

| Mode | Comportement | Cout OpenAI |
|------|--------------|-------------|
| `local` | Regles mots-cles uniquement | **0** - ideal en local |
| `hybrid` (prod recommande) | Local d'abord; OpenAI **seulement** si cas ambigu (confiance locale < 0.72) | Faible |
| `openai` | Toujours OpenAI si cle presente | Plus eleve |

Defaut: `local` sans cle; `hybrid` avec cle.

Autres limites:

- Modele: `gpt-4o-mini`
- `NGEMBA_OPENAI_MAX_TOKENS=350` (plafonne la reponse)
- Message tronque a 2000 caracteres avant envoi

---

## Ordre de grandeur (triage seul)

~500-800 tokens / alerte OpenAI avec gpt-4o-mini  
~1000 alertes OpenAI / mois ≈ **quelques USD** (souvent < 5-10 USD selon tarifs)

Avec `hybrid`, une grande part des alertes claires (accident, incendie, VBG explicite) **ne touche pas** OpenAI.

---

## Config `.env` (services/ngemba)

```bash
NGEMBA_AI_MODE=local          # local / hybrid / openai
NGEMBA_LOCAL_SKIP_THRESHOLD=0.72
NGEMBA_OPENAI_MAX_TOKENS=350
# OPENAI_API_KEY=             # optionnel en local
# GEOAPIFY_API_KEY=           # GPS reverse (SafeFind) - pas OpenAI
```
