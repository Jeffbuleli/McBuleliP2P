# Bloc Citoyen Amani (BCA) — profil NGEMBA

> Synergie citoyenne · Sud-Kivu · **pilote ops zone Sud-Kivu**  
> Logo : `services/ngemba/public/partners/bloc-citoyen-amani.png`

---

## Identité

| | |
|---|---|
| **Nom** | Bloc Citoyen Amani (BCA) |
| **Nature** | Synergie : confessions religieuses, mouvements citoyens, ASBL |
| **Ancrage** | Bukavu · Sud-Kivu · région des Grands Lacs |
| **Coordonnateur** | Josué Assani (Hassani / Assani Kisulu) — sources presse 2026 |
| **Email** | blocamanirdc@gmail.com |
| **Tél.** | +243 996 839 254 |
| **Facebook** | [profile.php?id=61593232664992](https://www.facebook.com/profile.php?id=61593232664992) |

**Mission (publique) :** paix (*Amani*), citoyenneté, développement communautaire, dignité humaine — reconnaissance des acteurs de paix (*Congo Peace Honors*), enquêtes sociales, plaidoyer humanitaire.

---

## Ce qu’on sait (sources ouvertes, 2026)

1. **Enfants de rue — Bukavu** : enquête BCA (janv.–fév. 2026) estimant ~**13 000** enfants en situation de rue ; plaidoyer médiation familiale, lutte contre accusations de sorcellerie, centres de réinsertion.
2. **Réfugiés congolais au Burundi** : indignation BCA sur conditions des camps (origine majoritaire Sud-Kivu / Uvira) ; appel au droit humanitaire et au retour digne.
3. **Congo Peace Honors** : distinctions d’acteurs humanitaires, académiques, religieux, médias, DH (Bukavu, ex. Hôtel Bach Palace / Ibanda).

---

## Profil technique NGEMBA

| Champ | Valeur |
|-------|--------|
| `id` | `bloc-citoyen-amani` |
| `slug` | `bca` |
| Role ops | `ngo` |
| Provinces | `sud-kivu` |
| Communes | Bukavu, Uvira, Baraka, Ibanda, Kadutu, Bagira |
| Fallback national | **non** (file locale Sud-Kivu) |
| Categories | `child_danger`, `school`, `vbg`, `harassment`, `assault`, `unknown`, `other` |
| Token env | `NGEMBA_OPS_TOKEN_NGO_BCA` |
| SLA critique | 8 min |
| Unités seed | Équipe Bukavu (protection enfant) · Équipe Uvira (paix & orientation) |

Code : `services/ngemba/src/lib/partners/directory.ts` · unités `src/lib/units/seed.ts` · auth `src/lib/ops/auth-tokens.ts`.

---

## Dashboard / cas Sud-Kivu (personnalisation)

Sur https://ngemba-rdc.org/ops les opérateurs BCA voient surtout :

| Priorité | Type d’alerte | Pourquoi ça colle à BCA |
|----------|---------------|-------------------------|
| 🔴 | Enfant en danger / Safe School | Enquête rue Bukavu, réinsertion |
| 🟠 | Harcèlement / VBG / agression | Orientation vers partenaires spécialisés + écoute |
| 🟢 | Autre / inconnu (zone SK) | Triage + orientation communauté / confession |

**Hors scope BCA (routage ailleurs) :** urgences vitales → numéros RDC d’abord ; VBG clinique lourde → Panzi / One Stop ; police → pas remplacée.

---

## Déploiement accès

1. Définir sur le VPS / Render : `NGEMBA_OPS_TOKEN_NGO_BCA=<token min 32 car.>`
2. Redéployer ou recharger l’env Ngemba.
3. Connexion : https://ngemba-rdc.org/ops/login → coller le code opérateur.
4. Formation : [32-FORMATION-OPS-BCA.md](./32-FORMATION-OPS-BCA.md)
5. Email accès : `npx tsx scripts/send-ngemba-bca-access-email.ts --to hi@mcbuleli.org --send`

**Ne pas committer le token** dans le dépôt.

---

## Perte / rotation du code opérateur

Il n’y a **pas** de self-reset sur `/ops/login` (le code = secret serveur `NGEMBA_OPS_TOKEN_NGO_BCA`). Facilitation prévue :

| Étape | Qui | Action |
|-------|-----|--------|
| 1 | Opérateur BCA | Contacte McBuleli : **hi@mcbuleli.org** / WhatsApp / `info@ngemba-rdc.org` — depuis l’email **connu** (`blocamanirdc@gmail.com`) ou le référent Josué Assani |
| 2 | McBuleli | Vérifie l’identité (email + tél. fiche partenaire) |
| 3 | McBuleli | `openssl rand -hex 20` → nouveau token |
| 4 | McBuleli | Met à jour `NGEMBA_OPS_TOKEN_NGO_BCA` sur le VPS + reload |
| 5 | McBuleli | Renvoie l’accès : `npx tsx scripts/send-ngemba-bca-access-email.ts --to blocamanirdc@gmail.com --send` |
| 6 | BCA | Ancien code **invalide** immédiatement (rotation = révocation) |

**Bonnes pratiques côté BCA :** 1–2 opérateurs max · code dans un gestionnaire / note sécurisée · ne pas poster sur Facebook/WhatsApp de groupe.

**Évolution prévue (pas encore livrée) :** lien magique / OTP envoyé uniquement à l’email partenaire enregistré + révocation admin depuis `/ops/partners`.

---

## Support

- info@ngemba-rdc.org · hi@mcbuleli.org  
- WhatsApp McBuleli (voir signature emails Patty B.)
- Sur `/ops/login` : lien « Code perdu ? »
