# NGEMBA - Phase 3b (App mobile Expo)

> **Statut :** v0.1 scaffold · builds store a venir

---

## Livre (v0.1)

| Feature | Detail |
|---------|--------|
| **Expo app** | `services/ngemba-mobile/` |
| **SOS / temoin** | API prod `/api/alerts` |
| **Mode discret** | Ecran sombre + haptics triple impact |
| **Triple-tap logo** | Navigation vers `/discrete` |
| **GPS** | `expo-location` (permission foreground) |
| **Session** | Recap urgence + resume IA |
| **i18n** | FR / EN (6 langues web restent sur PWA) |

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
| **Android** | Haptics + vibration systeme | Limite - widget 3b.2 |
| **iOS** | Haptics Taptic Engine | Pas de secousse background |

---

## 3b.2 (prochain)

1. EAS Build (APK/AAB + TestFlight)
2. Widget Android / Live Activity iOS si faisable
3. Volume key combo (native module)
4. Deep link `ngemba://discrete`

---

*Document v0.1*
