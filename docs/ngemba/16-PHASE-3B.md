# NGEMBA - Phase 3b (App mobile Expo)

> **Statut :** v0.2 · contacts de confiance + secousse 5x

---

## Livre (v0.2)

| Feature | Detail |
|---------|--------|
| **Expo app** | `services/ngemba-mobile/` |
| **SOS / temoin** | API prod `/api/alerts` |
| **Mode discret** | Ecran sombre + haptics triple impact |
| **Triple-tap logo** | Navigation vers `/discrete` |
| **Secousse 5x** | `expo-sensors` → mode discret (`source: shake`) |
| **Contacts de confiance** | 1-3 contacts · onboarding · alerte email/SMS |
| **GPS** | `expo-location` (permission foreground) |
| **Session** | Recap urgence + resume IA |
| **i18n** | FR / EN / LN / SW / LU / KG |

---

## Contacts de confiance

1. Onboarding au premier lancement (skippable)
2. Stockage local AsyncStorage + envoi avec chaque alerte
3. Backend notifie en parallele de l'ops :
   - **Email** via Resend si contact a un email
   - **SMS** via `NGEMBA_SMS_WEBHOOK_URL` ou Africa's Talking (`NGEMBA_AT_*`)

---

## Secousse 5x

- Detecteur accelerometre global (`app/_layout.tsx`)
- Cooldown 15 s entre declenchements
- Ouvre `/discrete?from=shake` avec haptics discrets
- iOS : foreground uniquement (limite Apple)

---

## Lancer

```bash
cd services/ngemba-mobile
cp .env.example .env
npm install
npm start
```

`EXPO_PUBLIC_NGEMBA_API_URL=https://ngemba.cyberalert-rdc.org`

---

## Plateformes

| OS | Secousse | Arriere-plan |
|----|----------|--------------|
| **Android** | Accelerometre + haptics | Limite - widget 3b.3 |
| **iOS** | Accelerometre foreground | Pas de secousse background |

---

## 3b.3 (prochain)

1. EAS Build (APK/AAB + TestFlight)
2. Widget Android / Live Activity iOS si faisable
3. Volume key combo (native module)
4. USSD / SMS fallback citoyen sans smartphone

---

*Document v0.2*
