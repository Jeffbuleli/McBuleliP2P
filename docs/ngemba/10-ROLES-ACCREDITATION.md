# NGEMBA - Roles et accreditations (dashboards)

> Chaque acteur voit **sa file** - pas la meme vue OPS.

---

## Matrice des roles

| Role | Dashboard | Token env | Permissions |
|------|-----------|-----------|-------------|
| **admin** | Vue d'ensemble + stats | `NGEMBA_OPS_TOKEN_ADMIN` (ou `NGEMBA_OPS_TOKEN`) | Tout |
| **ngo** | File ONG - orientation citoyens | `NGEMBA_OPS_TOKEN_NGO` | Voir + prendre en charge |
| **security** | File urgence - situations critiques | `NGEMBA_OPS_TOKEN_SECURITY` | Voir + prendre en charge |
| **partner** | Signalements agregés (lecture) | `NGEMBA_OPS_TOKEN_PARTNER` | Lecture seule |

---

## Filtres par role (implementes)

- **admin** : toutes les alertes + KPI (ouvertes, critiques, elevees)
- **ngo** : VBG, enfant, operateur standard/urgent, unknown
- **security** : urgence critical/high, agression, incendie, etc.
- **partner** : infrastructure, info, aggregated_report

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
2. Audit log acces ops (qui a ouvert quel dossier)
3. Assignation dossier → ONG specifique
4. SSO / comptes nominatifs (Phase 2)

---

*Document v1.0*
