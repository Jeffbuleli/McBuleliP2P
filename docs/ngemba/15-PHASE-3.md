# NGEMBA — Phase 3 (Alerte discrète & PWA)

> **Statut :** v1 web/PWA · app native Expo → Phase 3b

---

## Livré (web)

| Feature | Détail |
|---------|--------|
| **Mode discret** | `/discrete` — écran sombre prune, pas de flash rouge |
| **Vibration** | Web Vibration API à l'envoi (Android / navigateurs compatibles) |
| **Triple-tap logo** | Accès discret depuis l'accueil (3 taps rapides sur le logo) |
| **PWA** | `manifest.webmanifest` · raccourci « Mode discret » · installable |
| **Flag session** | `discreteMode` visible ops + email alerte |
| **OpenAI hybrid** | `NGEMBA_AI_MODE=hybrid` + Whisper sur VPS |

---

## Limites connues (documentées)

| Plateforme | Secousse / arrière-plan |
|------------|-------------------------|
| **iOS Safari** | Pas de Vibration API · pas de secousse en PWA |
| **Android Chrome** | Vibration OK · PWA installable |
| **App native** | Prévue Phase 3b (Expo) pour secousse + widget |

---

## URLs

- Mode discret : https://ngemba.cyberalert-rdc.org/discrete
- Triple-tap : logo NGEMBA sur l'accueil (3 fois)

---

## VPS OpenAI

```bash
NGEMBA_AI_MODE=hybrid
OPENAI_API_KEY=...      # clé McBuleli (depuis monorepo)
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_ASSISTANT_MODEL=gpt-4o-mini
```

---

## Phase 3b (prochaine)

1. Expo / React Native — secousse réelle
2. Widget écran verrou (Android)
3. Combinaisons boutons volume (native)

---

*Document v1.0*
