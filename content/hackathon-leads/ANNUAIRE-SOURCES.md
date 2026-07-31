# Annuaire contacts — HACKATHON AI KINSHASA

## Sources enregistrées

| Source | Fichier local | Statut |
|--------|---------------|--------|
| Liste entreprises + sites web (SECTEURS) | `sources/liste-entreprises-secteurs.pdf` (+ `.txt`) | Parsé |
| FEC Édition 2025 | `sources/ANNUAIRE-FEC-Edition-2025.pdf` (gitignored) | Emails extraits |
| GoAfrica Online (tech / informatique) | liens web | Pending (souvent sans email public) |
| Congo Virtuel entreprises privées | lien web | Archive emails (souvent anciens) |
| ANADEC PME | https://annuaire-pme.anadec.cd/ | À enrichir (filtre secteur) |
| Scribd Annuaire Contact Entreprises | lien | Accès payant / non extrait auto |
| FEC publications | https://fec-rdc.com/.../annuaires/ | Couvert via PDF Downloads |

## Fichiers dérivés

- `annuaire-contacts-registry.csv` — tous contacts SECTEURS (email + société + secteur)
- `annuaire-import-priority.csv` — **Kinshasa + email** prêt pour import Admin / script
- `annuaire-fec-emails.csv` — emails bruts FEC 2025
- `annuaire-fec-filtered.csv` — triage (import / import_corp / pending_freemail)
- `annuaire-fec-import-priority.csv` — **emails entreprise** prêts à importer (hors Gmail/Yahoo)
- `annuaire-fec-pending-freemail.csv` — freemails pages focus (à enrichir société)
- `annuaire-goafrica-pending.csv` — fiches tech sans email public (à enrichir)

## Critères ajustés (Kinshasa d’abord + SI)

Voir **`CRITERES-KINSHASA-SI.md`**.

- Critère n°1 : **Kinshasa** (+30)
- Critère n°2 : **entreprise / SI / métier** — PME ou grande, pas forcément tech (+15)
- Bonus : digital / logiciel / télécom / finance / IA
- Seuil **B_QUALIFIED ≥ 35** · **A_HOT ≥ 70**
- Exclusion : Silikin / TEXAF + partenaires en base

Le FEC importé = emails **entreprise** (domaines pro), y compris hors tech (industrie, commerce, mines…), car elles ont en général une équipe SI.

## État prod (après import SECTEURS + requalify)

- ~970 leads édition · quasi tous **A_HOT / B_QUALIFIED**
- Campagnes dry-run régénérées (developers / ai_data / entrepreneurs…)
- **Aucun envoi masse** sans APPROVE

## Workflow

1. Enrichir `annuaire-goafrica-pending.csv` / FEC focus avec emails publics vérifiés seulement.
2. Import `annuaire-import-priority.csv` (Admin → Leads ou script VPS).
3. Recalculer scores → Campagnes dry-run.
4. **Ne pas inventer d’emails.**
