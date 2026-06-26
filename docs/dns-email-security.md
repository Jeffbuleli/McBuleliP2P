# DNS email — SPF, DKIM, DMARC (mcbuleli.org)

Guide **Cloudflare DNS** pour les emails transactionnels **Resend** (`noreply@mcbuleli.org`) et le forwarding **Cloudflare Email Routing** (MX `route*.mx.cloudflare.net`).

Complète [email-resend.md](./email-resend.md).

---

## Prérequis

1. Compte [Resend](https://resend.com) → **Domains** → ajouter `mcbuleli.org` (ou sous-domaine `send.mcbuleli.org` si conflit MX).
2. Cloudflare → **DNS** → zone `mcbuleli.org`.
3. Noter si **Email Routing** est actif (MX Cloudflare déjà présents).

---

## Étape 1 — Enregistrements Resend (obligatoire pour l’envoi)

Dans **Resend → Domains → mcbuleli.org → Records**, copier **exactement** chaque enregistrement (bouton Copy).

Typiquement :

| Type | Name (hôte Cloudflare) | Valeur |
|------|------------------------|--------|
| **TXT** | `send` ou `@` | SPF fourni par Resend (souvent `v=spf1 include:amazonses.com ~all`) |
| **TXT** | `resend._domainkey` | Clé DKIM `p=…` |
| **MX** | `send` ou sous-domaine | MX bounce Resend (si indiqué) |

> Les noms exacts dépendent de votre config Resend (domaine racine vs `send.mcbuleli.org`). **Ne pas inventer** — utiliser le dashboard Resend.

Dans Cloudflare :

- **Proxy** : DNS only (nuage gris) pour TXT/MX/CNAME email.
- Puis **Verify DNS Records** dans Resend.

Expéditeur app : `McBuleli <noreply@mcbuleli.org>` (`src/lib/email/config.ts`).

---

## Étape 2 — SPF unique (Resend + Cloudflare Routing)

Un seul enregistrement SPF par hôte. Si vous envoyez via **Resend** et recevez/forwardez via **Cloudflare Email Routing** sur le même domaine :

**TXT** sur `@` (exemple à fusionner selon Resend) :

```txt
v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all
```

- `include:amazonses.com` — Resend (vérifiez la valeur exacte dans Resend).
- `include:_spf.mx.cloudflare.net` — Email Routing Cloudflare.

Si Resend fournit déjà un TXT SPF complet, **ajoutez** `include:_spf.mx.cloudflare.net` avant `~all` :

```txt
v=spf1 include:amazonses.com include:_spf.mx.cloudflare.net ~all
```

**Ne jamais** avoir deux TXT SPF séparés sur `@` — fusionner en un seul.

Vérification :

```bash
dig +short TXT mcbuleli.org
```

---

## Étape 3 — DKIM Resend

Ajouter le TXT `resend._domainkey` (ou CNAME si Resend le demande) **tel quel** depuis le dashboard.

Vérification :

```bash
dig +short TXT resend._domainkey.mcbuleli.org
```

---

## Étape 4 — DMARC (recommandé)

**TXT** sur `_dmarc` :

| Name | Content |
|------|---------|
| `_dmarc` | `v=DMARC1; p=quarantine; adkim=s; aspf=s; pct=100; rua=mailto:dmarc-reports@mcbuleli.org; fo=1` |

Phases :

1. **Semaine 1** — surveillance : `p=none; rua=mailto:dmarc-reports@mcbuleli.org`
2. **Semaine 2+** — `p=quarantine` puis `p=reject` si rapports OK

Créer la boîte `dmarc-reports@mcbuleli.org` (forward Cloudflare → `ceo@mcbuleli.org`).

Vérification :

```bash
dig +short TXT _dmarc.mcbuleli.org
```

---

## Étape 5 — Alignement From / Reply-To

| Usage | Adresse |
|-------|---------|
| From transactionnel | `noreply@mcbuleli.org` |
| Reply-To | `hi@mcbuleli.org` (`AUTH_EMAIL_REPLY_TO`) |
| Support | voir `src/lib/support-contact.ts` |

Le domaine du `From` doit correspondre au domaine DKIM vérifié dans Resend.

---

## Checklist finale

- [ ] Resend : domaine **Verified**
- [ ] `dig TXT mcbuleli.org` → un seul SPF avec Resend + Cloudflare si besoin
- [ ] `dig TXT resend._domainkey.mcbuleli.org` → clé présente
- [ ] `dig TXT _dmarc.mcbuleli.org` → politique DMARC
- [ ] Test envoi : inscription / reset password → en-têtes `spf=pass`, `dkim=pass` (Gmail → Afficher l’original)

---

## Dépannage

| Symptôme | Cause probable |
|----------|----------------|
| Resend `failed` | TXT copié avec le domaine en double dans le Name |
| Mail en spam | DMARC absent ou `From` ≠ domaine DKIM |
| SPF softfail | Deux TXT SPF sur `@` — fusionner |
| Conflit MX | Utiliser sous-domaine `send.mcbuleli.org` pour Resend uniquement |
