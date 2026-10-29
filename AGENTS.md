# Guide agent (McBuleli & écosystème)

Chaque **nouvelle tâche** = **New Agent**. Ne pas supposer l’historique des conversations précédentes.

## Démarrage obligatoire (2 min)

1. Lire ce fichier et **[docs/projects-ecosystem.md](docs/projects-ecosystem.md)** (carte de tous les dépôts actifs).
2. Ouvrir le **README** du dépôt concerné par la tâche (voir tableau dans `projects-ecosystem.md`).
3. Pour McBuleliP2P : **[docs/team-workflow.md](docs/team-workflow.md)** (local → GitHub → VPS, pas de rsync prod).
4. **Deploy / SSH prod McBuleli :** lire **[docs/vps-production-host.md](docs/vps-production-host.md)** avant `ops/vps/SERVER.md` (éviter 162.35 vs **153.75**).
5. Secrets : `.env` local uniquement — ne jamais committer.
6. **Emails partenaires Africa Insight :** toujours test `--to hi@mcbuleli.org --send` avant prod (`--confirm-prod`) — voir `content/email-partnership/africa-insight/partnership-email-workflow.md`.

## Où travailler

| Contexte | Racine |
|----------|--------|
| Hub monorepo (P2P, eAVEC, services) | `~/Documents/McBuleliP2P` |
| Tous les projets dans une fenêtre | `~/Documents/McBuleli-ecosystem.code-workspace` |

## Hors périmètre agent

- Godot retiré du disque ; jeu web / API `GET /api/game/client` restent dans ce repo.
- Ne pas modifier `~/Library/.../state.vscdb` à la main.

## Hygiène disque Cursor (équipe)

Voir **[ops/cursor-disk-hygiene.md](ops/cursor-disk-hygiene.md)** — purger les vieux chats (rétention 7 j) ; la mémoire de travail est le **git + docs**, pas l’historique agent.
