# Documents légaux McBuleli (local uniquement)

Ce dossier sert à stocker **RCCM**, **ID NAT** et autres scans pour les envois partenariat via **Resend** (terminal).

**Ne jamais committer** ces fichiers - ils restent sur votre machine.

## Fichiers attendus

Copiez vos scans ici (PDF recommandé, PNG accepté) :

| Fichier local | Contenu |
|---------------|---------|
| `rccm-1.pdf` ou `rccm-1.png` | RCCM - page 1 |
| `rccm-2.pdf` ou `rccm-2.png` | RCCM - page 2 |
| `id-nat.pdf` ou `id-nat.png` | Identification nationale |

**Emplacement :** `content/legal-private/` à la racine du repo McBuleliP2P.

### Anciens fichiers à la racine (toujours supportés)

Si vous aviez déjà `RCCM1.png`, `RCCM2.png`, `ID NAT.png` à la racine du projet, le script les détecte aussi.

## Vérifier avant envoi

```bash
cd /Users/mac/Documents/McBuleliP2P
npm run email:partnership -- --list-legal
```

## Envoyer l’email Silikin avec pièces jointes

```bash
# .env : RESEND_API_KEY=re_...  RESEND_ALLOW_SEND=true

# 1. Prévisualiser HTML (sans envoyer)
npm run email:partnership -- --template silikin_initial_fr --preview --attach-legal
open .tmp/partnership-silikin_initial_fr.html

# 2. Envoyer depuis ceo@mcbuleli.org via Resend
npm run email:partnership -- \
  --template silikin_initial_fr \
  --to j.kanda@texaf-rdc.com \
  --attach-legal \
  --send
```

L’expéditeur est **Jeff Buleli - McBuleli &lt;ceo@mcbuleli.org&gt;** pour ce template (signature alignée).

Pour forcer un autre expéditeur : `PARTNERSHIP_EMAIL_FROM="Jeff Buleli - McBuleli <ceo@mcbuleli.org>"` dans `.env`.

## Pourquoi Resend / terminal ?

La boîte `ceo@mcbuleli.org` n’a pas d’interface webmail classique - les envois passent par l’API **Resend** (même stack que les emails transactionnels McBuleli).
