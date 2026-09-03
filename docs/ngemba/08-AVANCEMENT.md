# NGEMBA - avancement plan

| Etape | Statut |
|-------|--------|
| S1-S4 + deploy live | ✅ |
| Localisation nationale + i18n | ✅ |
| **Bloc A** (auth, SSE, dossier, email) | ✅ |
| **Bloc B** (pilote JGL, legal, formation) | ✅ technique · signatures ⏳ |
| **Phase 2** (medias, chat, compte citoyen) | ✅ v1 |
| **Phase 3** (discret, vibration, PWA) | ✅ v1 web |
| **Phase 3b** (Expo mobile v0.1) | ✅ scaffold |
| **Phase 3b.2** (i18n LN+, locale persist, EAS) | ✅ v0.2 |
| **Phase 3b.3** (contacts confiance + secousse 5x) | ✅ v0.3 |
| **Phase 4** (Safe School + Jeunesse 10 scenarios) | ✅ v0.1 web |
| **Phase 4.2** (role school, mobile, contenu) | ✅ v0.2 |
| **Phase 5** (observatoire / heatmap k-anonyme) | ✅ v0.1 |
| **Phase 5.2** (carte OSM + filtres province/categorie) | ✅ v0.2 |

Live : https://ngemba.cyberalert-rdc.org

## Phase 5.2 - livre

- Carte Leaflet/OSM (centroides communes/villes, pas de pins individuels)
- Filtres province + categorie sur heatmap / export
- Voir [18-PHASE-5.md](./18-PHASE-5.md)

## Phase 5 - livre (v0.1)

- `/ops/observatory` - heatmap agrégée par zone
- API `/api/observatory/heatmap` + export CSV/JSON anonymise
- k-anonymity via `NGEMBA_K_ANONYMITY` (defaut 5)
- Voir [18-PHASE-5.md](./18-PHASE-5.md)

## Phase 4.2 - livre

- Role ops `school` + `NGEMBA_OPS_TOKEN_SCHOOL`
- Contenu `/prevent` + `/resources` enrichi (ecole / jeunesse)
- Mobile Expo : tuiles Ecole + Jeunesse + chat scenarios
- Voir [17-PHASE-4.md](./17-PHASE-4.md)

## Phase 4 - livre (web v0.1)

- `/school` Safe School · file referent ecole · protocole mineur
- `/jeunesse` + 10 scenarios IA interactifs · 6 langues
- Voir [17-PHASE-4.md](./17-PHASE-4.md)

## Phase 3b.3 - livre (Expo v0.3)

- Contacts de confiance (1-3) · onboarding · notify email/SMS backend
- Secousse 5x → mode discret (`source: shake`)
- Voir [16-PHASE-3B.md](./16-PHASE-3B.md)

## Phase 3b - livre (Expo v0.1)

- App mobile `services/ngemba-mobile/` - SOS, discret, haptics
- Voir [16-PHASE-3B.md](./16-PHASE-3B.md)

## Phase 3 - livre (web v1)

- `/discrete` · triple-tap logo · vibration · PWA manifest
- OpenAI hybrid + Whisper actifs sur VPS
- Voir [15-PHASE-3.md](./15-PHASE-3.md)

## Phase 2 - livre (v1)

- Upload photo / audio / video sur session
- Chat citoyen ↔ opérateur
- `/me` - historique alertes (cookie appareil)
- Whisper optionnel si `OPENAI_API_KEY`
- Voir [14-PHASE-2.md](./14-PHASE-2.md)

## Bloc B - reste humain

1. Signer [12-ACCORD-PILOTE-JGL.md](./12-ACCORD-PILOTE-JGL.md)
2. Relecture avocat RDC
3. Formation JGL · activer JGL apres validation

## Test local

```bash
cd services/ngemba && npm run dev
```

## Smoke prod

```bash
bash services/ngemba/ops/vps/bloc-b-smoke.sh
```
