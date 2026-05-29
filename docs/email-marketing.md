# McBuleli — emails marketing (Resend Broadcasts)

Les **Broadcasts** Resend sont **illimités** sur le plan adapté — distincts des emails transactionnels (quota 3 000/mois sur Free).  
Doc Resend : [Managing Broadcasts](https://resend.com/docs/dashboard/broadcasts/introduction).

| Type | Usage | Quota |
|------|--------|--------|
| **Transactional** | Auth, dépôts, retraits | Limité (API + tests) |
| **Broadcast** | Newsletter, promos, onboarding | Illimité (marketing) |

---

## Principes McBuleli

- **Minimaliste** : logo + titre + 2 phrases + 1 CTA (pas d’illustration lourde)
- **Texte court, fort** : une idée par email
- **FR + EN** : 9 campagnes × 2 langues = **18 modèles**
- **Personnalisation** : `{{{contact.first_name|ami}}}` / `{{{contact.first_name|there}}}`
- **Désabonnement** : `{{{RESEND_UNSUBSCRIBE_URL}}}` (obligatoire Resend)
- **CTA trackés** : liens avec `utm_source=email&utm_medium=broadcast&utm_campaign=…`

---

## Campagnes disponibles

| ID | Sujet (FR) | Cible | CTA |
|----|------------|--------|-----|
| `welcome` | Bienvenue | Nouveaux inscrits | Portefeuille |
| `staking` | Gagnez sur vos avoirs | Utilisateurs avec solde | Staking |
| `p2p` | P2P séquestre | Traders / curieux P2P | Marketplace P2P |
| `wallet_usdt` | Hub USDT | Dépôts USDT | Dépôt USDT |
| `avec` | Groupes AVEC | Épargne collective | Groupes |
| `kyc` | Vérification | Comptes non KYC | Profil / KYC |
| `security` | Sécurité | Tous | Passkeys / 2FA |
| `reengage` | Réactivation | Inactifs 30j+ | Connexion |
| `changelog` | Mise à jour | Toute la base | App |

Code source des textes : `src/lib/email/marketing-broadcasts.ts`  
Layout HTML : `src/lib/email/marketing-layout.ts`

---

## Exporter les HTML (local)

```bash
npm run resend:export-broadcasts
```

Génère `content/email-broadcasts/` :

- `mcbuleli-welcome-fr.html` (+ `.txt`, `.json` métadonnées)
- `mcbuleli-staking-en.html`
- … (18 fichiers HTML)

**Ne consomme pas** le quota transactionnel (aucun envoi API).

---

## Créer un Broadcast dans Resend

1. [Resend Dashboard](https://resend.com) → **Broadcasts** → **Create broadcast**
2. **Audience** : segment ou toute la liste (importer contacts depuis CSV / API)
3. Coller le HTML depuis `content/email-broadcasts/mcbuleli-<kind>-<locale>.html`
4. **Subject** : reprendre `subject` du fichier `.json` associé
5. Vérifier le placeholder prénom et le lien **Unsubscribe**
6. **Test Email** → votre boîte (compte dans quota si test réel — préférer preview)
7. **Send** ou planifier

### Styles globaux (éditeur Resend)

| Réglage | Valeur |
|---------|--------|
| Fond | `#e8f3ee` |
| Carte | `#ffffff`, radius 16px |
| Texte | `#0c0a09` |
| Secondaire | `#57534e` |
| Bouton | `#305f33` |
| Largeur | ~520px |

### Markdown (alternative)

Resend accepte le Markdown dans l’éditeur. Pour un brouillon rapide, copier le `.txt` exporté puis ajuster le CTA en bouton dans l’UI.

---

## Bonnes pratiques

1. **Séparer l’expéditeur** : marketing `news@mcbuleli.org` ou `hello@mcbuleli.org` vs `noreply@` transactionnel (config domaine Resend).
2. **Ne pas mélanger** broadcast et templates transactionnels — audiences différentes.
3. **RGPD / consentement** : n’envoyer qu’aux contacts opt-in ; lien désabonnement toujours présent.
4. **Fréquence** : max 2–4 broadcasts / mois pour éviter spam signals.
5. **A/B** : dupliquer un broadcast, changer uniquement le headline, mesurer les clics UTM dans analytics.

---

## Évolutions possibles (code)

- Sync API Broadcasts Resend (création draft programmatique)
- Déclenchement post-inscription (webhook → audience « welcome »)
- Segments : FR vs EN selon `users.locale`

Pour l’instant : export HTML + dashboard Resend = suffisant pour démarrer proprement.
