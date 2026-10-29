# Écosystème projets (Documents)

Référence unique pour les agents : chemins absolus, stack, doc d’entrée.

| Projet | Chemin | Entrée doc | Stack / notes |
|--------|--------|------------|----------------|
| **McBuleli P2P** (hub) | `/Users/mac/Documents/McBuleliP2P` | `README.md`, `docs/team-workflow.md` | Next.js, Postgres, services dans `services/` |
| Africa Insight | `/Users/mac/Documents/Afrika` | `README.md` | Next.js, Drizzle, SQLite, port **3001** |
| Cyber Alert DRC | `/Users/mac/Documents/CyberAlert` | `README.md` | Next.js, Postgres, AI gateway Python |
| McBuleli P2P (legacy split) | `/Users/mac/Documents/McBuleli_P2P` | `README.md` si présent | frontend + backend séparés |
| Ngemba mobile (standalone) | `/Users/mac/Documents/ngemba-mobile` | `README.md` | React Native / Expo |
| Ngemba (dans monorepo) | `McBuleliP2P/services/ngemba` | `services/ngemba/README.md` | API / back-office |
| Ngemba mobile (monorepo) | `McBuleliP2P/services/ngemba-mobile` | `services/ngemba-mobile/README.md` | même produit, copie intégrée |
| Immo RDC | `/Users/mac/Documents/immo_rdc` | `README.md` si présent | Next.js |
| Immo (monorepo) | `McBuleliP2P/services/immo-rdc` | `services/immo-rdc/README.md` | variante intégrée |
| McBuleli APP | `/Users/mac/Documents/McBuleli APP` | README local | mobile / app |
| Yekola | `/Users/mac/Documents/Yekola` | README local | — |
| DOCTA | `/Users/mac/Documents/DOCTA` | README local | — |
| SHINTA (Upwork) | `/Users/mac/Documents/SHINTA Upwork` | fichiers dans `content/shinta-reports/` côté hub | livrables rédaction |
| Avec | `/Users/mac/Documents/Avec` | README local | eAVEC / associé |

## Sous-projets dans McBuleliP2P

| Service | Doc |
|---------|-----|
| AI trading | `services/mcbuleli-ai-trading/README.md` |
| Contrats | `contracts/README.md` |
| Ops VPS / prod host | **[docs/vps-production-host.md](vps-production-host.md)**, `ops/vps/` |
| Contenu email / partenariats | `content/email-partnership/`, `content/email-broadcasts/README.md` |
| Hackathon | `content/hackathon-leads/`, `content/hackathon-designer-pack/BRIEF.md` |
| Formation Nov 2026 | `docs/events/nov26-formation.md`, `/nov26` |

## Règles transverses

- **Source de vérité prod** : GitHub `main` + deploy VPS pour McBuleliP2P / CyberAlert (voir README de chaque repo).
- **Contenu** : `content/` dans McBuleliP2P = emails, Africa Insight partenariats, rapports — ne pas confondre avec le code app.
- Tâche sur un autre dépôt : `cd` vers le chemin absolu ci-dessus, lire son README avant de coder.
