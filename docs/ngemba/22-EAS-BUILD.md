# NGEMBA Mobile - EAS Build (APK)

> Profile **preview** = APK installable hors Play Store (pilote terrain).

## Prerequisites

1. Compte Expo : https://expo.dev/signup
2. Dans `services/ngemba-mobile` :

```bash
npm install
npx eas-cli login
```

## Lier le projet (1re fois)

```bash
cd services/ngemba-mobile
npx eas-cli init
```

Cela ecrit `extra.eas.projectId` dans `app.json`. Committer ensuite.

## Build APK (preview)

```bash
npm run eas:apk
# equivalent : npx eas-cli build -p android --profile preview
```

- Build cloud Expo (~10-20 min)
- Lien de telechargement APK a la fin + page expo.dev
- API embarquee : `https://ngemba.cyberalert-rdc.org` (`eas.json` → env)

## Installer sur Android

1. Telecharger le `.apk` depuis le lien EAS
2. Autoriser installation depuis sources inconnues
3. Ouvrir NGEMBA → tester SOS / discrets / contacts

## Autres profiles

| Commande | Sortie |
|----------|--------|
| `npm run eas:apk` | APK interne (preview) |
| `npm run eas:aab` | AAB Play Store (production) |
| `npm run eas:ios` | Build iOS (besoin Apple Developer) |

## Token CI (optionnel)

```bash
export EXPO_TOKEN=...   # https://expo.dev/settings/access-tokens
npx eas-cli build -p android --profile preview --non-interactive
```

## Depannage

| Probleme | Action |
|----------|--------|
| Not logged in | `npx eas-cli login` |
| Missing projectId | `npx eas-cli init` |
| Assets manquants | Verifier `assets/icon.png` |
| Mauvaise API | Verifier `eas.json` → `EXPO_PUBLIC_NGEMBA_API_URL` |

Voir aussi [16-PHASE-3B.md](./16-PHASE-3B.md).
