# Academy unifié

```mermaid
flowchart TB
  A[Academy] --> C[Cohorte]
  C --> E[Événement SSOT]
  E --> L[McBuleli Live]
  E --> CO[Community post]
  F[/formation] -.->|leads| A
```

| Zone | URL |
|------|-----|
| Apprenant | `/app/academy` |
| Cohorte | `/app/academy/{edition}` |
| Live | `/app/academy/{edition}/event/{slug}` |
| Admin | `/admin/academy` |
| Leads | `/admin/academy?tab=leads` |
| Community | `/app/community/formations` → liens Academy |

## SSOT

`academy_training_events` ← sync ← `academy_sessions` (legacy)

Migration : `0081_academy_events_edition_link.sql`

## Admin (1 entrée)

Cohortes · Événements · Inscrits · Leads · Stats · Outils

## Terminologie

| OK | Éviter |
|----|--------|
| Academy | Academy Live, Events, Formation |
| Événement | Session, Live |
| McBuleli Live | Jitsi, Meet |
