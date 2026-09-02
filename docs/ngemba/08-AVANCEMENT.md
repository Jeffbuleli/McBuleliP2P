# NGEMBA - avancement plan

| Etape | Statut |
|-------|--------|
| S1-S4 + deploy live | ✅ |
| Localisation nationale + i18n | ✅ |
| **Bloc A** (auth, SSE, dossier, email) | ✅ |
| **Bloc B** (ONG pilote, juridique, formation) | ⏳ en cours |
| Phase 2 (medias, chat, ressources) | ⏳ apres Bloc B |

Live : https://ngemba.cyberalert-rdc.org

## Bloc A — termine

- Ops : `/ops/login` + tokens par role (`NGEMBA_OPS_TOKEN_ADMIN`, etc.)
- Email : Resend McBuleli → **hi@mcbuleli.org** (verification) · BCC **ceo@mcbuleli.org**
- From : `McBuleli NGEMBA <noreply@mcbuleli.org>`
- Logo NGEMBA : app + emails
- Dashboards differencies : admin / ONG / securite / partenaire (lecture seule)
- Securite v1 : rate limit, CSP, headers, blocage chemins sensibles

## Bloc B — pilote JGL AFRICA

- **Justicia Great Lakes (JGL AFRICA)** — Me Arjoule Karinda
- **En verification McBuleli** — pas d'acces ops direct ; alertes via **hi@mcbuleli.org**
- Apres validation : token `NGEMBA_OPS_TOKEN_NGO` + acces dashboard ONG
- Voir [09-BLOC-B.md](./09-BLOC-B.md)

## Test local

```bash
cd services/ngemba && npm run dev
```
