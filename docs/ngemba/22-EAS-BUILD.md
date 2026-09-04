# NGEMBA Mobile - EAS Build (APK)

> Profile **preview** = APK installable hors Play Store (pilote terrain).

## Repo dedie (source de verite EAS)

| | |
|--|--|
| **GitHub** | https://github.com/Jeffbuleli/ngemba-mobile |
| **Local** | `/Users/mac/Documents/ngemba-mobile` |
| **Expo** | `@mcbuleli-inc/ngemba` |
| **Miroir monorepo** | `McBuleliP2P/services/ngemba-mobile/` |

Ne plus lancer EAS depuis le monorepo (git root parent → Prebuild opaque).

## Prerequisites

```bash
cd /Users/mac/Documents/ngemba-mobile
npm install
# EXPO_TOKEN dans env, ou : npx eas-cli login
```

Credentials Android locales (gitignore) : `credentials.json` + `credentials/android/keystore.p12`.

## Build APK (preview)

```bash
cd /Users/mac/Documents/ngemba-mobile
npx eas-cli build -p android --profile preview --non-interactive
# ou : npm run eas:apk
```

- Build cloud Expo (~10-20 min)
- Lien APK en fin de build + page expo.dev
- API : `https://ngemba.cyberalert-rdc.org` (`eas.json` → env)

## Installer sur Android

1. Telecharger le `.apk` depuis le lien EAS
2. Autoriser installation depuis sources inconnues
3. Tester SOS / discret / contacts

## Autres profiles

| Commande | Sortie |
|----------|--------|
| `npm run eas:apk` | APK interne (preview) |
| `npm run eas:aab` | AAB Play Store (production) |
| `npm run eas:ios` | Build iOS (Apple Developer) |

## Depannage

| Probleme | Action |
|----------|--------|
| Not logged in | `EXPO_TOKEN` ou `npx eas-cli login` |
| Prebuild fail monorepo | Build depuis `ngemba-mobile` repo dedie |
| Missing projectId | `npx eas-cli init` |
| Assets manquants | Verifier `assets/icon.png` |
| Mauvaise API | `eas.json` → `EXPO_PUBLIC_NGEMBA_API_URL` |

Fix prebuild appliques : `newArchEnabled: false`, `expo-system-ui`, `.easignore`.

Voir aussi [16-PHASE-3B.md](./16-PHASE-3B.md).
