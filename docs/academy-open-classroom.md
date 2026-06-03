# Open Classroom McBuleli — audit & plan réaliste

## Étape 1 — Audit de l’existant (juin 2026)

### Ce qui est bon (à conserver)

| Zone | Détail |
|------|--------|
| **Architecture** | Companion léger `/app/academy/{edition}/live/{session}` + vidéo **hors app** (Jitsi) = faible data, PWA-friendly |
| **Phases live** | `setup` (20 min) · `warmup` · `main` · `ended` — `src/lib/academy-live.ts` |
| **Jitsi** | URL `meet.jit.si/mcbuleli-{edition}-{session}` + hash bas débit (360p, toolbar réduit) |
| **Chat** | McBuleli natif (cohorte + live), polling ~5s — pas de vidéo dans l’app |
| **IA** | Tuteur RAG cohorte (`/api/academy/tutor`) — syllabus only |
| **Ops** | Présence, BP, replays, rappels cron, admin `live_url` / `replay_url` |
| **Rôles app** | `user` · `agent` · `super_admin` — hub staff vs apprenant déjà séparé |

### Frictions / dettes (à améliorer, pas supprimer)

| Problème | Cause |
|----------|--------|
| Double entrée live | Cohorte : lien « Salle live » **et** « Rejoindre le live ↗ » (Jitsi direct) |
| Pas de rôle formateur dans l’URL Jitsi | Tous les liens en mode apprenant (360p, vidéo off) |
| UI salle live = liste + bouton | Pas de barre d’actions mobile, pas de temps restant visible |
| Invitation cohorte | Erreur générique « Invitation impossible » pour codes non mappés |
| Prompt « Open Classroom » | Vise iframe Jitsi custom + modération Zoom — **hors scope immédiat** sur `meet.jit.si` gratuit |

### À éviter (extrêmes du prompt)

- ❌ Rebuild type Zoom (participants grid, modération micro globale, lock session)
- ❌ Iframe Jitsi full UI masquée sans self-host + `@jitsi/react-sdk`
- ❌ Rôle CO-ANIMATEUR en base sans table `edition_hosts`
- ❌ Dashboard analytics formateur entreprise

### Milieu réaliste retenu

**Modèle « Companion Open Classroom »** (déjà amorcé, renforcé) :

1. **McBuleli** = salle de classe (header, phase, présence, chat, IA, quiz lien)
2. **Jitsi** = salle audio/vidéo (onglet externe, config URL selon rôle)
3. **Formateur** = `agent` / `super_admin` → lien Jitsi **host** (480p, caméra on)
4. **Apprenant** = lien standard + option **audio seul** (data Afrique)
5. **IA** = FAB discret « Demander à l’IA » (sheet mobile), pas chatbot plein écran

## Étape 2 — Rôles (mapping produit)

| Rôle prompt | Implémentation actuelle |
|-------------|-------------------------|
| USER / apprenant | Compte `user` inscrit cohorte |
| FORMATEUR | `super_admin` ou `agent` → `liveRole: host` |
| CO-ANIMATEUR | *Backlog* — même lien host ou modération Jitsi manuelle |
| IA McBuleli | `AcademyTutorPanel` + FAB live |

## Étape 3 — Flows

### Apprenant

```
Cohorte → Salle live → [Header: titre · LIVE · temps restant]
         → Rejoindre (vidéo) | Audio seul
         → Chat (sheet) · IA (sheet) · Présence
         → Retour cohorte
```

### Formateur

```
Même écran + badge « Animation »
         → Rejoindre en animateur (Jitsi host preset)
         → Annonces cohorte (déjà staff sur chat cohorte)
```

## Étape 4 — Jitsi (technique)

| Priorité URL | Source |
|--------------|--------|
| 1 | `academy_sessions.live_url` (admin) |
| 2 | `academy_editions.live_base_url` / `NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL` |
| 3 | `https://meet.jit.si/mcbuleli-{edition}-{session}#{config}` |

Modes : `learner` · `host` · `audio` — `buildLiveJoinUrl({ mode })`.

**Phase 2** : self-host `live.mcbuleli.org` ou iframe `@jitsi/react-sdk` sur domaine dédié.

## Étape 5 — Plan d’implémentation progressif

| Phase | Statut | Contenu |
|-------|--------|---------|
| **P0** | ✅ cette PR | UX salle live, temps restant, barre mobile, host/audio URLs, invite errors, doc |
| **P1** | Ops | `live_url` par session, replays, cron rappels |
| **P2** | Produit | Table `edition_hosts`, co-animateur |
| **P3** | Infra | Jitsi self-host + iframe optionnel |

## Références code

- `src/lib/academy-live.ts` — URLs & phases
- `src/lib/academy-live-role.ts` — host vs learner
- `src/components/academy/academy-live-room-client.tsx` — shell Open Classroom
- `src/components/academy/academy-open-classroom-bar.tsx` — barre mobile
