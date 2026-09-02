# NGEMBA - avancement plan

| Etape | Statut |
|-------|--------|
| S1-S4 + deploy live | ✅ |
| Localisation nationale + i18n | ✅ |
| **Bloc A** (auth, SSE, dossier, email) | ✅ |
| **Bloc B** (pilote JGL, legal, formation) | ✅ technique · signatures ⏳ |
| Phase 2 (medias, chat, ressources) | ⏳ prochaine |

Live : https://ngemba.cyberalert-rdc.org

## Bloc B — termine (technique)

- Pilote JGL : verification via **hi@mcbuleli.org**
- Pages : `/resources` · `/prevent` · `/legal/confidentialite` · `/legal/cgu` · `/legal/charte-ong`
- Docs : accord pilote · formation 30 min · smoke `ops/vps/bloc-b-smoke.sh`
- Token ONG : actif pour test McBuleli (pas encore transmis a JGL)

## Reste humain avant go JGL

1. Signer [12-ACCORD-PILOTE-JGL.md](./12-ACCORD-PILOTE-JGL.md)
2. Relecture avocat RDC des pages legal
3. Formation JGL ([13-FORMATION-OPS-JGL.md](./13-FORMATION-OPS-JGL.md))
4. Activer `NGEMBA_OPS_PILOT_VERIFIED=true` + email Me Arjoule
5. Premiere alerte citoyenne reelle orientee par JGL

## Test local

```bash
cd services/ngemba && npm run dev
```

## Smoke prod

```bash
bash services/ngemba/ops/vps/bloc-b-smoke.sh   # sur VPS
```
