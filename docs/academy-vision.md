# McBuleli Academy — vision, audit & roadmap

> **Philosophie** : SIMPLICITÉ > COMPLEXITÉ · ILLUSTRATIONS > LONGS TEXTES · LEARN → PRACTICE → USE MCBULELI  
> **Référence** : inspiré de [Google Classroom](https://classroom.google.com/) — **pas une copie** — adapté MobileFirst, crypto, Afrique, faible data.

---

## 1. Audit de l’existant (codebase, juin 2026)

### Routes & navigation

| Zone | URLs | Rôle |
|------|------|------|
| Hub Academy | `/app/academy` | Liste cohortes, badges, formation lead |
| Cohorte | `/app/academy/{edition}?program=` | Sessions, chat, tuteur, quiz |
| Live companion | `/app/academy/{edition}/live/{session}` | Open Classroom + Jitsi externe |
| Quiz | `/app/academy/quiz/{slug}?edition=` | Micro-quiz + BP |
| Inscription publique | `/formation` | Sans compte |
| Verify badge | `/verify/{code}` | Open Badges |
| Admin | `/admin/academy`, `/admin/training-registrations` | Ops |
| Profil | `/app/profile` → tuile Academy | Entrée secondaire |

### Auth & rôles

- `user` · `agent` · `super_admin` — pas de rôle `formateur` / `cohort_host` en base
- Live host = staff (`academy-live-role.ts`)
- Hub : `viewer: staff | learner` sur `/api/academy/overview`

### Data model (déjà riche)

| Table | Usage vision |
|-------|----------------|
| `academy_programs.level` | `discovery` · `foundation` · `pro` · `expert` → **niveaux UX** |
| `academy_editions` | Cohortes datées (juin 2026) |
| `academy_sessions` | Lives + replays |
| `academy_enrollments` | Inscription cohorte |
| `academy_attendance` | Présence live → progression |
| `academy_quizzes` + `attempts` | Micro-learning |
| `academy_credentials` | Badges / certifications |
| `academy_learning_events` | Analytics xAPI-lite (enrolled, attended, quiz_passed…) |
| `training_registrations` | Pont `/formation` |

### Features déjà livrées (Phases A–D + Open Classroom)

- Enroll USDT / gratuit · BP · KYC gate
- Chat cohorte · annonces staff
- Tuteur IA RAG (`/api/academy/tutor`)
- Jitsi bas débit · host/audio modes
- Rappels cron · Open Badges · invites cohorte
- Staff vs apprenant · sync formation

### Design system

- `academy-ui.ts` — tokens légers (`fd-primary`, cartes blanches, vert `#305f33`)
- `profile-action-grid` — tuile Academy
- i18n FR/EN complet (`messages.ts`)
- PWA shell app existant (`/app/*`)

### IA McBuleli

- **Academy** : tuteur syllabus (cohorte + sheet live)
- **Global** : assistant app (hors scope Academy hub — liens recommandés seulement)

---

## 2. Rapport intelligent

### A. Ce qui fonctionne bien ✅

- Séparation **companion / Jitsi** = mobile + faible RAM
- **Cohorte** comme unité pédagogique (pas catalogue infini)
- **Quiz + présence + badges** = boucle progression mesurable
- **Formation publique** → compte → cohorte (growth funnel)
- **learning_events** prêt pour IA contextuelle future

### B. À conserver tel quel

- Tables & APIs Academy existantes
- Open Classroom barre mobile
- Admin ops · cron · replays
- Pas de vidéo in-app

### C. À améliorer (sans rebuild)

- **Home Academy** : trop « liste admin », pas assez **parcours guidé**
- **Progression visible** : données en base, peu visibles UX
- **Lien écosystème** : P2P / wallet / bots peu mis en avant post-module
- **Profil** : pas de « My Crypto Journey »
- **Modules** : pas de pages micro-leçon illustrées (contenu = seed + quiz, pas UI module)

### D. À simplifier

- Fusionner messages hub (cohorte hero + journey + continue) en **un flux vertical**
- Réduire texte ; cartes + barre progression + icônes
- Une seule CTA principale « Continuer »

### E. Risques complexité inutile ❌

- Copier Classroom (devoirs, notes, rubrics, stream infini)
- Table `academy_modules` + CMS complet avant contenu réel
- Iframe Jitsi custom sans self-host
- 6 niveaux hard-codés sans contenu par niveau
- Dashboard formateur analytics

### F. Incohérences UX

| Incohérence | Mitigation P0 |
|-------------|----------------|
| Hub ≠ parcours guidé | Journey card + next step |
| Niveaux en DB ≠ affichés | Mapper `program.level` → label UX |
| IA tuteur ≠ niveau user | Backlog : contexte `learning_events` dans prompt |
| `/formation` vs in-app | Déjà pont ; CTA journey |

---

## 3. Gap analysis (où nous sommes vs vision)

| Vision | État | Gap |
|--------|------|-----|
| Home Academy scannable | Hub liste | **P0** journey hero |
| Niveaux / classes | `program.level` en DB | **P0** labels UX ; **P2** vrai curriculum |
| Micro-modules illustrés | Quiz seul | **P2** contenu + pages module |
| Live → replay → quiz → progress | Chaîne technique OK | **P0** next step visible |
| IA mentor adaptatif | Tuteur fixe RAG | **P1** niveau dans contexte API |
| My Crypto Journey (profil) | Absent | **P0** teaser profil |
| Push P2P / wallet / bots | Absent | **P0** liens recommandés |
| Illustrations first | Texte i18n | **P1** assets `/public/academy/` |

---

## 4. Juste milieu réaliste

```
Google Classroom (structure cohorte + live + devoirs légers)
  + Binance Academy (crypto scannable)
  + Duolingo (barre progression, next step)
  + McBuleli (P2P, wallet, IA, bots — pas cours générique)
```

**Produit = parcours crypto guidé vers l’écosystème McBuleli**, pas LMS enterprise.

**Unité centrale** : **Cohorte** (édition) + **sessions live** + **quiz** — pas 100 cours orphelins.

---

## 5. Architecture UX (information architecture)

```
/app/academy                    ← HOME (journey + continue + lives + ecosystem)
  └─ /[edition]                 ← COHORTE (sessions, chat, tuteur, quiz)
       └─ /live/[session]       ← OPEN CLASSROOM (existant)
  └─ /quiz/[slug]               ← MICRO-QUIZ (existant)

/formation                      ← Acquisition (hors compte)

/app/profile                    ← Teaser "Mon parcours crypto" → /app/academy
```

**Futur (P2)** : `/app/academy/modules/[slug]` — micro-leçon 1 écran.

---

## 6. Navigation flow (MobileFirst)

### Nouvel utilisateur

```
Landing /formation → compte → Hub "Explorer Crypto" 0%
  → Activer cohorte → Cohorte → Live setup → Présence → Quiz → Badge
  → Liens "Essayer P2P" / "Wallet"
```

### Utilisateur actif

```
Hub → "Continuer" (prochain live ou quiz ou cohorte)
  → Live companion → Jitsi
  → Retour → Progress +25%
```

### Staff

```
Hub ops → Admin (inchangé)
```

---

## 7. Wireframes textuels (home Academy, mobile)

```
┌─────────────────────────────┐
│ McBuleli Academy            │
├─────────────────────────────┤
│ Bonjour, Marie              │
│ Niveau: Explorer Crypto     │
│ ████████░░░░░░░░  40%       │
│ Prochaine étape:            │
│ Session live sam. 15 juin   │
│ [ Continuer → ]             │
├─────────────────────────────┤
│ 📅 Prochains lives          │
│ ┌ Live · 8 juin · LIVE → ┐ │
│ └ Session 15 juin      → ┘ │
├─────────────────────────────┤
│ 🎯 Recommandé McBuleli      │
│ [Wallet] [P2P] [IA]         │
├─────────────────────────────┤
│ Mes cohortes · Badges       │
└─────────────────────────────┘
```

---

## 8. Component strategy

| Composant | Statut |
|-----------|--------|
| `academy-hub-client` | **Refactor P0** — sections journey |
| `academy-journey-progress` | **Nouveau P0** |
| `academy-edition-client` | Conserver |
| `academy-live-room-client` | Conserver |
| `academy-open-classroom-bar` | Conserver |
| `academy-journey-teaser` (profil) | **Nouveau P0** |
| `academy-module-page` | P2 |

**Reuse** : `academy-ui.ts`, `fetchWithDeadline`, overview API, i18n, `getEditionDetail` pour lives.

---

## 9. Reuse strategy

- **Progression** : calcul client+serveur depuis enrollments + attendance + quiz attempts + credentials — **pas nouvelle table P0**
- **Niveaux** : mapper `academy_programs.level` existant
- **Next step** : heuristique dans `academy-journey.ts`
- **Lives** : `upcomingSessions` dans overview API
- **IA** : lien vers cohorte tuteur (déjà là) ; pas nouveau chat global P0

---

## 10. Roadmap progressive

| Phase | Scope | Effort |
|-------|--------|--------|
| **P0** ✅ | Doc vision + home journey + profil teaser + ecosystem links | 1–2 j |
| **P1** | ✅ Assets `/public/academy/` · mentor IA (niveau + events) · parcours visuel thèmes | — |
| **P1b** | Email journey Resend (rappel progression) · PNG marketing | ops |
| **P2** | `academy_modules` table + pages micro-leçon · unlock chain | 1–2 sem |
| **P3** | IA mentor full context · parcours Pro 49 USDT | 2+ sem |
| **Ops** | Replays · cron · Resend (parallèle) |

---

## Mapping niveaux (guidelines → produit)

| Niveau UX | `program.level` | Label FR (P0) |
|-----------|-----------------|---------------|
| 0 | `discovery` | Explorer Crypto |
| 1 | `foundation` | Utilisateur Crypto |
| 2 | `foundation` + cohorte active | Écosystème McBuleli |
| 3 | `pro` | Bases Trading |
| 4 | `pro` + bots topic | Bot Trading |
| 5 | `expert` | Crypto Avancé |

Heuristique progression % (P0) :

- +20 % inscription cohorte launch
- +20 % ≥1 présence live
- +20 % quiz fondamentaux passé
- +20 % ≥2 présences
- +20 % ≥1 badge

---

## Cohérence McBuleli ?

Chaque écran Academy doit répondre : **« Est-ce que ça rapproche l’utilisateur du wallet / P2P / IA / bots ? »**  
Sinon → simplifier ou retirer.

---

Voir aussi : `docs/academy.md`, `docs/academy-open-classroom.md`, `docs/launch-campaign.md`.
