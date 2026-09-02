# NGEMBA

> Plateforme de **sécurité, protection et paix citoyenne** (RDC).  
> Plan : [`docs/ngemba/PLAN-MAITRE.md`](../../docs/ngemba/PLAN-MAITRE.md) · Phase 0 : [`docs/ngemba/PHASE0-AUDIT.md`](../../docs/ngemba/PHASE0-AUDIT.md)

**URL temporaire :** [https://ngemba.cyberalert-rdc.org](https://ngemba.cyberalert-rdc.org)  
**VPS :** `153.75.235.176` (Cyber Alert + Africa Insight + Patty) · port local `3012`

## Local

```bash
cd services/ngemba
cp .env.example .env
npm install
createdb ngemba_dev   # si Postgres local
npm run db:push
npm run dev           # http://localhost:3012
```

## Design

- Police : **Poppins**
- Primaire : `#06402b`
- Secondaire : `#882364`
- SOS : `#c41e3a`
- SVG only - tirets `-` - 6 langues : FR EN LN SW LU KG
- McBuleli IA au centre (OpenAI)

Voir `docs/ngemba/01-DESIGN-TOKENS.md` et `docs/ngemba/06-PLAN-COMBINE-OPENAI.md`.

```bash
npm run dev   # http://localhost:3012
```

## Prod (plus tard)

1. DNS `A ngemba.cyberalert-rdc.org → 153.75.235.176`
2. Nginx : `ops/vps/nginx-ngemba.conf`
3. DB `ngemba` sur instance Postgres Cyber Alert (`:5433`)
4. Deploy Docker (compose à ajouter en fin de Phase 0)

Phase 0 = scaffold + docs.  
Phase 1 (en cours) : SOS texte + GPS optionnel + triage McBuleli IA (OpenAI) + ecran session.
