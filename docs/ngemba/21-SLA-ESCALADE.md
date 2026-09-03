# NGEMBA - SLA & escalade

> Statut : **v0.1** (etape 3 philo orientation)

---

## Principe

Si le service **local** ne prend pas en charge avant le SLA → **escalade** vers fallback national / admin (pas laisser la victime sans file).

---

## Delais par defaut (minutes)

| Urgence | SLA | Env override |
|---------|-----|--------------|
| critical | 5 | `NGEMBA_SLA_CRITICAL_MIN` |
| high | 20 | `NGEMBA_SLA_HIGH_MIN` |
| medium | 60 | `NGEMBA_SLA_MEDIUM_MIN` |
| low | 240 | `NGEMBA_SLA_LOW_MIN` |
| info | 1440 | `NGEMBA_SLA_INFO_MIN` |

Partenaire peut imposer `slaMinutesCritical` plus serre (ex. ecole Kinshasa = 10).

---

## Comportement

1. A la creation : `slaDueAt` calcule
2. Tant que status `active` / `opened` : evaluation a chaque lecture file / dossier
3. Si depasse et pas encore escalade :
   - `escalation` ecrite + historique systeme
   - bassin elargi aux partenaires `nationalFallback`
   - scope local → `national_fallback`
   - notify email / webhook (`ngemba.alert_escalated`)
   - event SSE `alert_escalated`
4. Ticket cron manuel : `POST /api/ops/sla-tick` (admin)

---

## UI ops

- Badges file : SLA Xx min / SLA serre / SLA depasse / Escalade
- Dossier : bandeau raison d'escalade
- Stats admin : compteur SLA / escalade

---

## Limites v0.1

- Escalade = elargissement file + alerte ops (pas de dispatch police auto)
- Pas encore de niveau 2 (ex. autorite civile) - a definir avec partenaires

---

*Document v0.1*
