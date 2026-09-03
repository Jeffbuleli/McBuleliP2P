# NGEMBA Mobile (Phase 3b)

App **Expo / React Native** - SOS, mode discret, secousse, contacts de confiance.

- **API :** https://ngemba.cyberalert-rdc.org
- **Version :** 0.3.0

## Demarrage (Expo Go)

```bash
cd services/ngemba-mobile
cp .env.example .env
npm install
npm start
```

## Build APK (EAS)

```bash
npx eas-cli login
npx eas-cli init    # 1re fois
npm run eas:apk
```

Guide complet : [docs/ngemba/22-EAS-BUILD.md](../../docs/ngemba/22-EAS-BUILD.md)

## Livre

| Feature | Detail |
|---------|--------|
| SOS + temoin + ecole | Flows + GPS optionnel |
| Mode discret | Triple-tap logo + secousse 5x |
| Contacts confiance | Ressource dossier (pas notify auto) |
| Jeunesse | 10 scenarios |
| EAS preview | APK Android interne |

Voir [docs/ngemba/16-PHASE-3B.md](../../docs/ngemba/16-PHASE-3B.md).
