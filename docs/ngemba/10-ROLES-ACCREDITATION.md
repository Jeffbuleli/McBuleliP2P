# NGEMBA - Roles et accreditations (dashboards)

> Chaque acteur voit **sa file** - pas la meme vue OPS.

---

## Matrice des roles

| Role | Dashboard | Token env | Permissions |
|------|-----------|-----------|-------------|
| **admin** | Vue d'ensemble + stats | `NGEMBA_OPS_TOKEN_ADMIN` (ou `NGEMBA_OPS_TOKEN`) | Tout |
| **ngo** | File ONG - orientation citoyens | `NGEMBA_OPS_TOKEN_NGO` | Voir + prendre en charge |
| **security** | File urgence - situations critiques | `NGEMBA_OPS_TOKEN_SECURITY` | Voir + prendre en charge |
| **partner** | Signalements agregés (lecture) + observatoire | `NGEMBA_OPS_TOKEN_PARTNER` | Lecture + export anonymise |
| **school** | File Safe School - eleves / mineurs | `NGEMBA_OPS_TOKEN_SCHOOL` | Voir + prendre en charge |

---

## Filtres par role (implementes)

- **admin** : toutes les alertes + KPI + observatoire + annuaire partenaires
- **ngo** : mandat VBG/enfant/... **et** couverture zone (ou fallback national)
- **security** : urgence / categories securite **et** couverture
- **partner** : infrastructure / agreges **et** couverture
- **school** : Safe School **et** zone (pilote Kinshasa)

Orientation : [20-PARTENAIRES-ZONES.md](./20-PARTENAIRES-ZONES.md)

---

## Pilote JGL AFRICA (en attente verification)

| | |
|--|--|
| Organisation | Justicia Great Lakes (JGL AFRICA) |
| Referent | Me Arjoule Karinda |
| Statut | **En verification McBuleli** - pas de token ONG encore |
| Email ops (phase test) | **hi@mcbuleli.org** seulement + BCC ceo@mcbuleli.org |
| Apres validation | `NGEMBA_OPS_PILOT_VERIFIED=true` + email `akarhinda@gmail.com` + token ONG |

---

## Prochaines etapes roles

1. Generer token ONG dedie pour JGL apres verification
2. Generer token ecole pilote Kinshasa (`NGEMBA_OPS_TOKEN_SCHOOL`)
3. Audit log acces ops (qui a ouvert quel dossier)
4. Assignation dossier → ONG / ecole specifique

---

*Document v1.1*
