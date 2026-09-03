# NGEMBA Mobile (Phase 3b)

App **Expo / React Native** pour secousse native, mode discret et alertes via l'API prod.

- **API :** https://ngemba.cyberalert-rdc.org
- **Assets :** https://media.cyberalert-rdc.org/ngemba/brand/

## Demarrage

```bash
cd services/ngemba-mobile
cp .env.example .env
npm install
npm start
```

Puis scanner le QR avec **Expo Go** (Android/iOS) ou lancer un simulateur :

```bash
npm run android
npm run ios
```

## v0.1 livre

| Feature | Detail |
|---------|--------|
| SOS + temoin | Flow message + GPS optionnel |
| Mode discret | Ecran sombre + triple secousse haptique |
| Triple-tap logo | Acces discret depuis l'accueil |
| Haptics | `expo-haptics` a l'envoi |
| Session | Confirmation + resume IA |
| i18n | FR / EN |

## Prochain (3b.2)

- Widget Android / raccourci ecran verrou
- Combinaisons boutons volume
- Historique `/me` (cookie citoyen)
- Build EAS TestFlight / Play Internal

Voir [docs/ngemba/16-PHASE-3B.md](../../docs/ngemba/16-PHASE-3B.md).
