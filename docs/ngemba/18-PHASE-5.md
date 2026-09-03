# NGEMBA - Phase 5 (Ville & institutions)

> **Statut :** v0.1 MVP observatoire agrégé

---

## Livre (v0.1)

| Module | Route | Detail |
|--------|-------|--------|
| **Observatoire** | `/ops/observatory` | Heatmap zones + stats categories / jours |
| **API heatmap** | `GET /api/observatory/heatmap?days=30` | Snapshot k-anonyme |
| **API export** | `GET /api/observatory/export?format=csv\|json` | Export sans PII |
| **Seuil k** | `NGEMBA_K_ANONYMITY` (defaut 5) | Zone visible seulement si count >= k |

---

## Regles de confidentialite

- Aucun pin individuel, aucun `session.id`, aucun message citoyen
- Zone = commune ou premier segment du `locationLabel`
- Zones sous le seuil k : masquees (compteur `suppressedZones`)
- Export : uniquement lignes des zones deja publiees (k-anonymes)

---

## Permissions

| Role | Voir | Exporter |
|------|------|----------|
| admin | oui | oui |
| partner | oui | oui |
| ngo / security | oui | non |
| school | non | non |

---

## Prochain (Phase 5.2)

1. Carte Leaflet/OSM (centroides communes, pas de points individuels)
2. Filtre province / categorie
3. Partenariat municipalite Kinshasa (humain)
4. Cron refresh vue matérialisée Postgres (quand DB dediee)

---

*Document v0.1*
