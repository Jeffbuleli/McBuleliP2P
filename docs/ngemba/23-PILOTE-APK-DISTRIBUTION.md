# NGEMBA - Distribution APK pilote

> Build preview EAS `888f6f3e` · hors Play Store · testeurs internes / JGL

---

## Liens

| | |
|--|--|
| **APK direct** | (build `51529f24` en cours - page Expo) https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/51529f24-d969-46aa-bef6-40ba5863c479 |
| **Page build** | https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/51529f24-d969-46aa-bef6-40ba5863c479 |
| **Web / PWA** | https://ngemba-rdc.org |
| **Lien APK sur le site** | Home → « APK Android » |
| **Repo mobile** | https://github.com/Jeffbuleli/ngemba-mobile |

API cible de l'APK : `https://ngemba-rdc.org`

---

## Install Android

1. Ouvrir le lien APK sur le téléphone (Chrome).
2. Autoriser l'installation depuis sources inconnues si demandé.
3. Installer **NGEMBA** · ouvrir l'app.
4. Accepter localisation si proposé (utile pour SOS).

---

## Checklist test terrain (15 min)

Cocher et renvoyer à `info@ngemba-rdc.org` (appareil + Android version).

| # | Test | OK ? |
|---|------|------|
| 1 | App s'ouvre · home SOS + McBuleli IA visibles | |
| 2 | Changer langue (FR / LN / SW…) · texte change | |
| 3 | **SOS** : envoyer une alerte test (mentionner « TEST PILOTE ») | |
| 4 | GPS / position jointe ou refus géré sans crash | |
| 5 | **Clarifier** (polish texte) si bouton présent | |
| 6 | **Mode discret** depuis le parcours prévu | |
| 7 | **Secousse 5×** → entre en mode discret | |
| 8 | Ajouter 1 contact de confiance · sauvegarde OK | |
| 9 | Tuiles École / Jeunesse s'ouvrent | |
| 10 | Pas de crash au retour home | |

Alerte test : confirmer réception côté ops (`/ops` ou email `info@ngemba-rdc.org`).

---

## Message WhatsApp / email (copier-coller)

```
NGEMBA - test APK pilote

Bonjour,

Merci de tester l'app Android NGEMBA (canal citoyen McBuleli / Cyber Alert).

1) Installer (Android) :
https://expo.dev/artifacts/eas/ewCQpWoxhAGKji1l1rlIJqLq_zvFTPfUFY0Rj-IbsII.apk

2) Sur le site (sans install) :
https://ngemba-rdc.org

3) Tests prioritaires (~15 min) :
- SOS avec le mot « TEST PILOTE » dans le message
- Mode discret + secousse du téléphone 5 fois
- 1 contact de confiance
- Changer la langue

Renvoyer : modèle téléphone + Android + ce qui a marché / bloqué
→ info@ngemba-rdc.org

Merci
Équipe McBuleli
```

---

## Notes

- APK **preview** : signature locale EAS, pas Play Store.
- Rebuild : voir [22-EAS-BUILD.md](./22-EAS-BUILD.md) depuis `/Users/mac/Documents/ngemba-mobile`.
- Accord / formation ops : [12-ACCORD-PILOTE-JGL.md](./12-ACCORD-PILOTE-JGL.md) · [13-FORMATION-OPS-JGL.md](./13-FORMATION-OPS-JGL.md).
