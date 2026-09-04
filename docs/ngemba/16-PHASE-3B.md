# NGEMBA - Phase 3b (App mobile Expo)

> **Statut :** v0.3 · EAS APK `888f6f3e` pret · distribution [23-PILOTE-APK-DISTRIBUTION.md](./23-PILOTE-APK-DISTRIBUTION.md)

---

## Livre

| Feature | Detail |
|---------|--------|
| **Expo app** | `services/ngemba-mobile/` |
| **SOS / temoin** | API prod `/api/alerts` |
| **Mode discret** | Ecran sombre + haptics |
| **Secousse 5x** | `expo-sensors` → mode discret |
| **Contacts de confiance** | 1-3 · ressource dossier ops (pas notify auto) |
| **EAS** | Profile `preview` → **APK** · voir [22-EAS-BUILD.md](./22-EAS-BUILD.md) |
| **i18n** | FR / EN / LN / SW / LU / KG |

---

## Build APK (resume)

```bash
cd services/ngemba-mobile
npm install
npx eas-cli login
npx eas-cli init          # 1re fois seulement
npm run eas:apk
```

Details : [22-EAS-BUILD.md](./22-EAS-BUILD.md)

---

## Contacts de confiance

1. Onboarding au premier lancement (skippable) + ecran dedie
2. Champs : nom, lien, telephone, email, adresse/quartier
3. Stockage local AsyncStorage + envoi avec chaque alerte
4. **Pas de notify auto** a la creation
5. Ops : Appeler / WhatsApp / Email manuels

Voir [19-PHILO-ORIENTATION-PROCHES.md](./19-PHILO-ORIENTATION-PROCHES.md)

---

## Lancer (Expo Go)

```bash
cd services/ngemba-mobile
cp .env.example .env
npm install
npm start
```

`EXPO_PUBLIC_NGEMBA_API_URL=https://ngemba.cyberalert-rdc.org`

---

## Prochain

1. Widget Android / Live Activity iOS
2. Volume key combo
3. USSD / SMS fallback citoyen
4. TestFlight / Play Internal (apres APK valide)

---

*Document v0.3*
