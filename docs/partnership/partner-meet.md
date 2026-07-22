# McBuleli Meet - RDV partenaires

Parcours standard pour toutes les visioconférences partenaires.

## Règle d'or

**Ne jamais partager** une URL nue `https://live.mcbuleli.org/{room}`.

Toujours partager la landing :

```
https://mcbuleli.org/meet/{slug}
```

Flux : landing → login McBuleli → JWT → `live.mcbuleli.org/{room}?jwt=…`

## Créer un RDV

```bash
# Après migration drizzle/0110_partner_meets.sql
npx tsx scripts/seed-kilelo-partner-meet.ts
```

Ou via `upsertPartnerMeet` dans `src/lib/partner-meet`.

## URLs

| Rôle | Path |
|------|------|
| Invitation publique | `/meet/{slug}` |
| Participant | `/meet/{slug}/join` |
| Hôte (CEO / staff) | `/meet/{slug}/host` |

## Accès

- Compte McBuleli requis
- Join autorisé : email hôte, email partenaire, allowlist, ou staff (agent / super_admin)
- Mode hôte : email hôte ou staff

## Exemple Kilelo

- Slug : `kilelo-partenariat`
- Landing : https://mcbuleli.org/meet/kilelo-partenariat
- Hôte : ceo@mcbuleli.org
