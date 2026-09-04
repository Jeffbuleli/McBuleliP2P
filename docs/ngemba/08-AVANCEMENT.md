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
| **Phase 3b.4** (EAS APK preview) | ✅ APK dispo (build `888f6f3e`) |
| **Phase 4** (Safe School + Jeunesse 10 scenarios) | ✅ v0.1 web |
| **Phase 4.2** (role school, mobile, contenu) | ✅ v0.2 |
| **Phase 5** (observatoire / heatmap k-anonyme) | ✅ v0.1 |
| **Phase 5.2** (carte OSM + filtres province/categorie) | ✅ v0.2 |
| **UI audit** (McBuleli IA centre, polish, charts, PWA install) | ✅ v0.3 |
| **Repo mobile dedie** (`Jeffbuleli/ngemba-mobile`) | ✅ pour EAS stable |
| **Domaine propre** (`ngemba-rdc.org`) | ⏳ cutover DNS/TLS/Resend |

Live : https://ngemba-rdc.org · email `info@ngemba-rdc.org`  
Cutover : [24-DOMAINE-NGEMBA-RDC.md](./24-DOMAINE-NGEMBA-RDC.md) (DNS / TLS / Resend / APK)

## UI audit - livre

- Home SOS-first + McBuleli IA central (sans tuile Parler)
- Clarifier OpenAI (`POST /api/ai/polish`) sur parcours alerte
- Charts SVG ops + observatoire
- Pages Aide / Prevenir en icones ; jeunesse grille SVG
- PWA : bouton Installer (Chrome) + hint iOS ; manifest McBuleli IA

## Phase 3b.4 - EAS APK

- Profile `preview` → APK Android
- **Repo dedie :** https://github.com/Jeffbuleli/ngemba-mobile (local `/Users/mac/Documents/ngemba-mobile`)
- Miroir : `services/ngemba-mobile/` dans McBuleliP2P
- Doc : [22-EAS-BUILD.md](./22-EAS-BUILD.md)
- Fix prebuild : `newArchEnabled: false` · `expo-system-ui` · `.easignore`
- Fix bundle JS : deps `expo-asset` · `expo-font` · `expo-file-system` (repo dedie `97939c4`)
- **APK :** https://expo.dev/artifacts/eas/ewCQpWoxhAGKji1l1rlIJqLq_zvFTPfUFY0Rj-IbsII.apk
- Page build : https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/888f6f3e-43d3-469c-8356-9f1b8313aac6

## Distribution pilote APK

- Pack pret : [23-PILOTE-APK-DISTRIBUTION.md](./23-PILOTE-APK-DISTRIBUTION.md)
  (lien APK · checklist 15 min · message WhatsApp/email)

## Prochain (technique)

1. Cutover domaine `ngemba-rdc.org` (DNS + TLS + Resend `info@`) - [24-DOMAINE-NGEMBA-RDC.md](./24-DOMAINE-NGEMBA-RDC.md)
2. Rebuild APK pointe vers le nouveau domaine · redistribuer
3. Widget Android / volume keys (native)
4. Bloc B : signatures JGL + relecture avocat

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

## Philosophie orientation (direction)

- Service competent **proche** de la victime (pas diffusion nationale aveugle)
- Proches de confiance = **aide dossier** (wa.me / email), pas notify auto systematique
- **v1 aligne** : champs enrichis, bloc ops, notify auto retire
- **v2 aligne** : annuaire partenaires par zone + file filtree + fallback national
- **v3 aligne** : SLA + escalade nationale si pas de prise en charge
- Voir [19-PHILO-ORIENTATION-PROCHES.md](./19-PHILO-ORIENTATION-PROCHES.md) · [20-PARTENAIRES-ZONES.md](./20-PARTENAIRES-ZONES.md) · [21-SLA-ESCALADE.md](./21-SLA-ESCALADE.md)

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
