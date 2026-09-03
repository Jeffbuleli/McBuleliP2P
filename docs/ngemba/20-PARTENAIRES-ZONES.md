# NGEMBA - Annuaire partenaires & orientation proximite

> Statut : **v0.1** (etape 2 de la philo orientation)

---

## Principe

Alerte → **partenaires dont la zone couvre le lieu** (+ mandat categorie).  
Sinon → **fallback national** (badge « Hors zone »).

Voir [19-PHILO-ORIENTATION-PROCHES.md](./19-PHILO-ORIENTATION-PROCHES.md).

---

## Livre

| Element | Detail |
|---------|--------|
| Annuaire seed | `src/lib/partners/directory.ts` |
| Override | `NGEMBA_PARTNERS_JSON` (tableau JSON) |
| Matching | `buildRoutingMeta` a la creation d'alerte |
| File ops | filtre role + couverture zone |
| Dossier | panneau « Orientation par proximite » |
| Admin UI | `/ops/partners` |
| Token dedie | `tokenEnv` ex. `NGEMBA_OPS_TOKEN_NGO_JGL` |

---

## Seed initial

| Partenaire | Role | Zone | Fallback |
|------------|------|------|----------|
| McBuleli national | admin | national | oui |
| JGL AFRICA | ngo | national | oui |
| Referent ecole Kinshasa | school | kinshasa | non |
| Securite nationale | security | national | oui |
| Infra Kinshasa | partner | kinshasa | oui |

---

## Ajouter un partenaire local (ex. Beni)

Via env `NGEMBA_PARTNERS_JSON` (remplace le seed) ou extension du seed :

```json
{
  "id": "ong-beni",
  "name": "ONG locale Beni",
  "slug": "beni",
  "opsRoles": ["ngo"],
  "categories": ["vbg", "child_danger", "assault"],
  "coverageProvinceIds": ["nord-kivu"],
  "coverageCommunes": ["Beni"],
  "nationalFallback": false,
  "active": true,
  "tokenEnv": "NGEMBA_OPS_TOKEN_NGO_BENI"
}
```

Avec un token dedie, cet ops ne voit que son bassin.  
Sans token dedie, la file `NGO` voit l'union des partenaires ngo.

---

## Champs session

`routingMeta` :

- `provinceId` / `provinceName` / `commune`
- `matchedPartnerIds`
- `scope` : `local` | `national_fallback` | `unassigned`
- `note`

---

## Prochain

1. SLA local + escalation si pas de prise en charge
2. Tokens par org en prod (JGL, ecole, Beni…)
3. Edition annuaire via UI admin (aujourd'hui seed / JSON)

---

*Document v0.1*
