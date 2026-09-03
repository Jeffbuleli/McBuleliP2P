# NGEMBA - Phase 5 (Ville & institutions)

> **Statut :** v0.2 carte OSM + filtres

---

## Livre

| Module | Route | Detail |
|--------|-------|--------|
| **Observatoire** | `/ops/observatory` | Carte Leaflet/OSM + barres zones + stats |
| **API heatmap** | `GET /api/observatory/heatmap?days=&province=&category=` | Snapshot k-anonyme + `mapPoints` |
| **API export** | `GET /api/observatory/export?format=csv\|json&province=&category=` | Export sans PII |
| **Seuil k** | `NGEMBA_K_ANONYMITY` (defaut 5) | Zone visible seulement si count >= k |

---

## Phase 5.2 (livre)

1. **Carte Leaflet / OpenStreetMap** - cercles sur **centroides** communes/villes (referentiel `rdc-places` + Kinshasa)
2. **Filtres** province (`?province=kinshasa`) et categorie (`?category=vbg`)
3. Export CSV respecte les memes filtres + colonne `province`
4. Aucun pin GPS individuel - jamais `session.lat/lng` sur la carte

---

## Regles de confidentialite

- Aucun pin individuel, aucun `session.id`, aucun message citoyen
- Zone = commune ou premier segment du `locationLabel`
- Zones sous le seuil k : masquees (compteur `suppressedZones`)
- Export : uniquement lignes des zones deja publiees (k-anonymes)
- Carte : uniquement centroides du referentiel RDC (pas de jitter GPS)

---

## Permissions

| Role | Voir | Exporter |
|------|------|----------|
| admin | oui | oui |
| partner | oui | oui |
| ngo / security | oui | non |
| school | non | non |

---

## Prochain

1. Partenariat municipalite Kinshasa (humain)
2. Cron / vue materialisee Postgres (quand DB dediee)
3. Couches optionnelles (ecoles partenaires) sans PII

---

*Document v0.2*
