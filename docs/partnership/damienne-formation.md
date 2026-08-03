# Formation privée Damienne (Elisabeth Adilelou)

- **Hub** : https://mcbuleli.org/hackathon/damienne
- **Meet** : https://mcbuleli.org/meet/damienne-formation
- **Apprenante** : elisabethadilehou571@gmail.com (Bénin · GMT+1)
- **Rythme** : 3×/semaine 19h · 14 sessions · 3 août → 2 sept. 2026
- **Focus** : Vibe Coding + SDK Pi Network

## Ops

```bash
npx tsx scripts/seed-damienne-partner-meet.ts
npx tsx scripts/send-damienne-formation-email.ts --to hi@mcbuleli.org --send
npx tsx scripts/send-damienne-formation-email.ts --to elisabethadilehou571@gmail.com --send
```

Avant chaque session live : mettre à jour `scheduledAt` du meet (seed ou upsert) pour la fenêtre d'1h guest.
