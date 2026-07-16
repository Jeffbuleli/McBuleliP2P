# McBuleli Builders Program (MBP) - Spécification draft

> **Statut :** M1 partiel en code - tables + achat McB (tx) + admin + page `/app/community/builders` + badge profil. Perks / ambassadeurs pas encore.  
> **Slogan :** Build. Grow. Belong.  
> **Dernière révision :** juillet 2026  
> **Liés :** [mcbuleli-constitution-outline.md](./mcbuleli-constitution-outline.md) · [community-hub-master-plan.md](./community-hub-master-plan.md) (G9 badges) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md) (§6.4–6.5) · [social-utility-graph.md](./social-utility-graph.md)

Le Builders Program **complète** BP et McB ; il ne les remplace pas. Un badge élevé **ne confère pas** de rôle officiel McBuleli.

**Env (M1) :** `BUILDERS_PROGRAM_ENABLED=true` · `MCB_BUILDERS_TREASURY=0x…` · preview UI via `NEXT_PUBLIC_BUILDERS_PREVIEW` (défaut visible).

---

## 1. Objectifs

- Soutenir la croissance de McBuleli
- Développer la communauté
- Identifier les futurs leaders locaux
- Fidéliser les utilisateurs actifs
- Créer un système de **statut** durable - McB comme symbole de noblesse / engagement payant
- Créer de la **demande DEX** : les paliers MBP se paient en **McB**, pas en BP

---

## 2. Philosophie : BP = facile, McB = noblesse

Esprit humain : ce qui est gratuit (like, comment, post → BP) est perçu comme **facile et négligeable**. Ce qui s’achète ou se mérite difficilement (McB on-chain) devient **statut**.

| Actif | Rôle psychologique | Canal |
|-------|--------------------|-------|
| **BP** | Engagement gratuit, réputation soft, perks légers | Earn in-app (gratuit) |
| **McB** | Noblesse, paliers Builders, ads, fees premium | Claim limité (40 %) **ou achat DEX** |

**Règle produit :** maximiser les services qui **exigent McB** (pas BP) pour que le jeton soit plus **acheté** que revendu.

---

## 3. Niveaux (badges) - payés en McB

| Niveau | Code | Prix McB (proposition) | Activité min (soft) | Statut |
|--------|------|------------------------|---------------------|--------|
| Bronze | `bronze` | **100** | KYC | Live config |
| Silver | `silver` | **300** | KYC + upgrade | Live config |
| Gold | `gold` | **800** | KYC + upgrade | Live config |
| Diamond | `diamond` | **2000** | KYC + upgrade | Live config |
| Platinum | `platinum` | **5000** | KYC + upgrade | Live config |

Prix dans `src/lib/builders/builders-config.ts` - ajustables avant marketing scale.

**Paiement :** burn ou lock McB depuis wallet BEP-20 / ledger custodial (décision technique M1).  
**Source McB :** claim communautaire **ou** achat PancakeSwap - les Builders **seront poussés à acheter** quand le pool claim est rare / épuisé.

**Durée :** chaque badge est valable **24 mois**. À l’expiration : renouvellement en McB, upgrade, ou sortie. Les avantages expirent avec le badge.

**Conservé après expiration :** historique, réputation, McB déjà claimés / achetés.

**BP ne paie pas** Bronze → Platinum. Les BP peuvent seulement **débloquer l’éligibilité** (soft gate : KYC, quality score) - jamais remplacer le paiement McB.

---

## 4. Avantages (cadre - à chiffrer avant lancement)

Selon le niveau, un membre **peut** bénéficier de (liste indicative) :

- Réductions de frais (MM, swap, retraits) - **plafonnées** et rentables pour McBuleli
- Support prioritaire
- Accès anticipé / bêta
- Academy Premium (durée limitée)
- Événements privés
- Badge visible profil Community (symbole de noblesse)
- Accès early features SUG / ads créateur

**Règle économique :** aucun avantage n’est publié tant que le modèle de coût/marge n’est pas validé (finance + produit).

---

## 5. Lien avec BP (secondaire)

Les BP restent le carburant **gratuit** :

- Like, comment, post, KYC, staking, P2P, Academy, Community (voir `reward-points-config.ts`)
- Perks légers (discount P2P/bots), boost Community Horizon A

Ils **n’achètent pas** un badge MBP. Un gros solde BP sans McB = membre actif, pas Builder titré.

---

## 6. Gouvernance communautaire (trois couches)

| Rôle | Accès | Qui décide |
|------|-------|------------|
| **Builder** | Badge McB-payé + avantages | Paiement McB + règles auto |
| **Ambassadeur** | Candidature | Sélection McBuleli (charte + KYC + activité) |
| **Représentant officiel** | Nomination | McBuleli uniquement |

Acheter du McB ou un badge élevé **ne garantit jamais** un rôle officiel.

### Ambassadeurs (conditions cibles)

- Badge minimum (TBD, ex. Gold)
- KYC validé
- Activité régulière
- Formation interne
- Signature d’une charte

### Représentants officiels

Mission : représenter l’entreprise, développer la communauté locale, événements, partenariats. Mandat **indépendant** du badge (éligibilité minimum possible).

Expiration badge → période de transition + réévaluation pour ambassadeurs / représentants.

---

## 7. Points ouverts avant go-live produit

1. Nature juridique du programme (conformité pays ciblés)
2. Prix McB exacts Bronze → Platinum (+ burn vs lock)
3. Soft gates activité / quality score (sans remplacer le paiement McB)
4. Modèle économique des avantages (plafond coût plateforme)
5. Modalités de renouvellement à 24 mois
6. Custody : paiement on-chain vs ledger McB interne

---

## 8. Implémentation technique (après validation)

Comble la lacune **G9** (badges / réputation Community) + sink McB (§6.4 tokenomics) :

| Étape | Livrable | Statut |
|-------|----------|--------|
| M1 | Tables `builders_memberships` + paiement McB (tx on-chain + admin) | **Code** (migration 0098) |
| M2 | Soft eligibility (quality score) | Pending |
| M3 | UI `/app/community/builders` + badge profil public | **Code** |
| M4 | Perks liés aux niveaux | Pending |
| M5 | Charte ambassadeur + admin nomination représentants | Pending |
| M6 | Lien DEX sur page upgrade | **Code** (si `MCB_PANCAKESWAP_URL` / contrat) |

Admin : `/admin/builders`. API user : `GET/POST /api/builders/me`.

**Ne pas** marketing-lancer les prix tant que trésorerie + liquidité DEX + revue juridique ne sont pas clos.

---

## 9. Message public (whitepaper)

Publier : vision, niveaux nommés, **paiement en McB** (seuils TBD), durée 24 mois, distinction Builder / Ambassadeur / Représentant.  
Pas de tables de discounts chiffrés tant qu’ils sont TBD. Pas de promesse de prix McB.
