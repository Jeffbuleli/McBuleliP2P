# McBuleli Pay — transferts internes

McBuleli Pay est le transfert **instantané** entre comptes McBuleli (USDT, PI, etc.), sans blockchain. Les fonds restent sur la plateforme : débit du solde expéditeur, crédit du destinataire, une ligne dans l’historique wallet.

Comparable à **Binance Pay** (paiement par ID / QR / e-mail entre utilisateurs Binance), **Cash App** ($Cashtag), ou **PayPal** (e-mail), mais limité aux utilisateurs inscrits McBuleli.

## Les 3 façons d’identifier le destinataire

| Méthode | Côté expéditeur | Côté destinataire | Résolution serveur |
|--------|------------------|-------------------|---------------------|
| **E-mail** | Saisir l’e-mail du compte McBuleli | — | `users.email` (insensible à la casse) |
| **UUID** | Coller l’ID compte (36 caractères) | Copier depuis Profil → sous le QR | `users.id` |
| **QR McBuleli Pay** | Scanner le QR du profil | Afficher le QR (sans texte) sur Profil | Décode `mcbuleli://pay/{uuid}` → `users.id` |

Une seule méthode suffit par transfert. L’API `POST /api/wallet/transfer` accepte soit `recipientEmail`, soit `recipientUserId` (jamais les deux).

## Flux QR (recommandé)

1. **Destinataire** : Profil → QR (payload `mcbuleli://pay/<userId>`).
2. **Expéditeur** : Portefeuille → Envoyer → onglet **McBuleli Pay** → le scanner s’ouvre.
3. Après scan : affichage du destinataire (ID tronqué), saisie **montant** + **mémo**, puis **Envoyer**.
4. Le serveur vérifie le solde, exécute le transfert en base, écrit le ledger.

Pas de frais réseau on-chain : c’est un mouvement de ledger interne.

## Flux e-mail

1. L’expéditeur saisit l’e-mail exactement comme à l’inscription.
2. Si aucun compte : `wallet_transfer_user_not_found`.
3. Sinon : même exécution que pour l’UUID.

Utile quand le destinataire partage son e-mail, pas son QR.

## Sécurité et limites

- Connexion requise (session cookie).
- Impossible de s’envoyer à soi-même (`wallet_transfer_self`).
- Montant > 0, actif supporté (USDT, PI, …).
- Mémo optionnel (max 180 caractères).
- Le QR ne contient **pas** de montant : le payeur choisit toujours le montant (comme Binance Pay scan).

## KYC

Le badge KYC n’est plus sur la carte Profil ; le statut est visible dans **Paramètres**. McBuleli Pay ne remplace pas la conformité P2P / retraits on-chain.

## Référence technique

- URI : `src/lib/wallet-pay-uri.ts` — `walletPayUri()`, `parseWalletPayRecipient()`
- API : `src/app/api/wallet/transfer/route.ts`
- Logique : `src/lib/wallet-internal-transfer.ts`
- UI scan : `src/components/wallet/wallet-qr-scanner.tsx`
- UI profil QR : `src/components/profile/profile-hero.tsx`
