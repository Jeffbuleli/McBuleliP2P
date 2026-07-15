# Broadcast Whitepaper - planification

Fichiers prêts (quota Broadcasts Resend ≠ quota transactionnel API) :

| Locale | HTML | Subject |
|--------|------|---------|
| FR | `mcbuleli-whitepaper-fr.html` | C'est officiel - le Whitepaper McBuleli est publié |
| EN | `mcbuleli-whitepaper-en.html` | It's official - McBuleli Whitepaper is live |

CTA : `https://mcbuleli.org/whitepaper?utm_source=email&utm_medium=broadcast&utm_campaign=whitepaper`  
WhatsApp footer : `https://wa.me/message/IF6DXNT6Q2VSI1`  
Bandeau : `https://mcbuleli.org/launch/whitepaper-announce.jpg` (déployer le VPS avant l'envoi)

## Demain (16 juillet 2026) - Resend

1. Déployer le VPS si pas encore fait (`bash /opt/mcbuleli/ops/vps/deploy.sh`) pour que l'image bandeau soit en ligne.
2. [Resend → Broadcasts → Create](https://resend.com/broadcasts)
3. Audience : liste marketing opt-in
4. From : `Jeff Buleli — McBuleli <hi@mcbuleli.org>` (ou `news@` si configuré)
5. Subject : coller depuis le `.json` FR (puis dupliquer EN si segment EN)
6. Body : coller tout le HTML `mcbuleli-whitepaper-fr.html`
7. Preview (sans Send test API si le quota transactionnel est serré)
8. **Schedule** pour demain matin (ex. 09:00 GMT+1 / Kinshasa)

Régénérer les HTML après modification des textes :

```bash
npm run resend:export-broadcasts
```
