# McBuleli Builders Program (MBP) - Spécification draft

> **Statut :** M1 partiel en code - tables + achat McB (tx) + admin + page `/app/community/builders` + badge profil. Perks / ambassadeurs pas encore.  
> **Slogan :** Build. Grow. Belong.  
> **Dernière révision :** juillet 2026  
> **Liés :** [mcbuleli-constitution-outline.md](./mcbuleli-constitution-outline.md) · [community-hub-master-plan.md](./community-hub-master-plan.md) (G9 badges) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md) (§6.4–6.5) · [social-utility-graph.md](./social-utility-graph.md) · [community-roles-map.md](./community-roles-map.md) · [builders-pricing-usd-anchor.md](./builders-pricing-usd-anchor.md) · [builders-perks-economics.md](./builders-perks-economics.md)

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

## 3. Niveaux (badges) - ancre **USD**, règlement en McB

**Règle anti-catastrophe :** le prix économique est en **USD** (24 mois), pas un sticker McB fixe.  
McB à envoyer = `ceil(USD / cours)`. Voir [builders-pricing-usd-anchor.md](./builders-pricing-usd-anchor.md).

| Niveau | Code | Prix **USD** (proposition) | McB | Activité min (soft) | Statut |
|--------|------|----------------------------|-----|---------------------|--------|
| Bronze | `bronze` | **25** | = f(cours) | KYC | Live config |
| Silver | `silver` | **75** | = f(cours) | KYC + upgrade | Live config |
| Gold | `gold` | **200** | = f(cours) | KYC + upgrade | Live config |
| Diamond | `diamond` | **500** | = f(cours) | KYC + upgrade | Live config |
| Platinum | `platinum` | **1250** | = f(cours) | KYC + upgrade | Live config |

Anciens stickers 100/300/800/2000/5000 McB = **legacy** (≈ USD à 0,25 $/McB) — **ne plus utiliser** comme prix économique.

Prix USD / quote : `src/lib/builders/builders-pricing.ts`. Env cours : `MCB_USD_RATE`.

**Paiement :** burn ou lock McB depuis wallet BEP-20 (décision technique M1).  
**Remises frais :** seulement si cours ≥ seuil min **et** `fee_perks_unlocked` (sinon badge soft seulement).

**Durée :** chaque badge est valable **24 mois**. À l’expiration : renouvellement au **cours du jour** (USD catalogue → McB), upgrade, ou sortie. Les avantages expirent avec le badge.

**Conservé après expiration :** historique, réputation, McB déjà claimés / achetés.

**BP ne paie pas** Bronze → Platinum. Les BP peuvent seulement **débloquer l’éligibilité** (soft gate : KYC, quality score) - jamais remplacer le paiement McB.

---

## 4. Avantages (cadre chiffré — brouillon finance)

Détail floors / CAP / soft : **[builders-perks-economics.md](./builders-perks-economics.md)**.  
**Ne pas publier** les % marketing tant que finance n’a pas signé.

| Tier | Remise frais (relatif) | CAP manque à gagner / an | Soft (expire 24 mois) |
|------|------------------------|---------------------------|------------------------|
| Bronze | Mild optionnel (−5 % swap) | ~8–12 USD | Badge |
| Silver | −10 % swap ; −5 % MM | ~25–40 USD | Early soft |
| **Gold** | **−15 %** → floors 4,25 % / 0,85 % / 2,125 % · withdraw 1,75 · futures 4 bps | **~90–120 USD** | Salon · boost↑ · Academy soft · priorité · **éligibilité Ambassadeur** |
| Diamond | −20 % (floors ≥ Platinum floors) | ~200–280 USD | Beta SUG · events |
| **Platinum** | **−25 %** → floors 3,75 % / 0,75 % / 1,875 % · withdraw 1,50 · futures 3 bps | **~350–450 USD** | Concierge · conseil soft · early ads |

**Règle économique :** aucun avantage n’est publié tant que le modèle de coût/marge n’est pas validé (finance + produit). Après CAP annuel atteint → tarifs baseline.

Selon le niveau, un membre **peut** aussi bénéficier de (soft, liste indicative) :

- Support prioritaire / concierge
- Accès anticipé / bêta
- Academy Premium (durée limitée)
- Événements privés / salon tier
- Badge visible profil Community
- Accès early features SUG / ads créateur

---

## 5. Lien avec BP (secondaire)

Les BP restent le carburant **gratuit** :

- Like, comment, post, KYC, staking, P2P, Academy, Community (voir `reward-points-config.ts`)
- Perks légers (discount P2P/bots), boost Community Horizon A

Ils **n’achètent pas** un badge MBP. Un gros solde BP sans McB = membre actif, pas Builder titré.

---

## 6. Gouvernance communautaire (trois couches)

Cartographie détaillée (privilèges badge vs mandats charte, rôles proposés) : [community-roles-map.md](./community-roles-map.md).

**Ordre d’accès (noblesse → responsabilité terrain) :**

1. Effort gratuit → échelle réputation (Membre…**Pillier**) - label seulement, **aucune** responsabilité entreprise  
2. McB → badge **Builder** (Bronze→Platinum) - noblesse / statut payant  
3. **Gold+** = critère d’éligibilité soft pour candidater aux mandats terrain  
4. **Ambassadeur / Rep.** = charte ou nomination - seuls rôles qui engagent McBuleli sur le terrain  

Le top score s’appelle **Pillier** (ex-« Ambassadeur » score) pour éviter toute confusion avec l’Ambassadeur charte.

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
