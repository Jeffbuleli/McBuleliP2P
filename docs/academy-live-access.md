# Live `live.mcbuleli.org` — accès contrôlé

```mermaid
flowchart LR
  subgraph join [Rejoindre un live]
    A[Compte McBuleli]
    B[Inscription cohorte]
    C[Token / companion]
    D[Jitsi]
  end
  subgraph host [Créer un live]
    P[Forfait USDT]
    S[Live Studio]
    H[Salle réservée]
  end
  A --> B --> C --> D
  P --> S --> H --> D
```

| Rôle | Condition | Coût |
|------|-----------|------|
| **Participant** | Compte + inscrit à l’édition | Gratuit |
| **Animateur** | Staff McBuleli, co-host, ou **Live Studio** payé | 3–28 USDT |

## App (pas de login Jitsi User/Password)

| Étape | URL |
|-------|-----|
| Entrée recommandée | `/app/academy/…/live/…` (companion) |
| Lien direct salle | `https://mcbuleli.org/app/live/enter?edition=…&session=…&program=…` |
| Non connecté | → `/login?next=…` puis JWT → Jitsi |
| Pas de compte | → inscription depuis login |

**Ne pas** envoyer `https://live.mcbuleli.org/salle` seul (popup User/Password).

- **Rejoindre** : companion ou `/app/live/enter` → `join-token` + `?jwt=…`
- **Héberger** : `/app/academy/studio` → USDT → création édition

## VPS (recommandé)

1. `enableWelcomePage: false` (déjà dans `ops/jitsi/`)
2. **JWT** : voir `ops/jitsi/jwt-setup.md` + variables Render :

```env
JITSI_APP_ID=mcbuleli_live
JITSI_JWT_SECRET=<secret 32+ chars>
JITSI_JWT_SUB=live.mcbuleli.org
```

Sans JWT, l’app bloque déjà les liens directs ; le VPS reste ouvert si quelqu’un devine l’URL de salle.

## Migration

`drizzle/0063_academy_live_purchases.sql` — table `academy_live_purchases`, colonnes `owner_user_id` / `source` sur `academy_editions`.
