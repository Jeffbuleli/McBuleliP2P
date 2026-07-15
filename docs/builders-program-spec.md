# McBuleli Builders Program (MBP) - Spécification draft

> **Statut :** draft produit - **pas encore implémenté** dans l’app  
> **Slogan :** Build. Grow. Belong.  
> **Dernière révision :** juillet 2026  
> **Liés :** [mcbuleli-constitution-outline.md](./mcbuleli-constitution-outline.md) · [community-hub-master-plan.md](./community-hub-master-plan.md) (G9 badges) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md)

Le Builders Program **complète** BP et McB ; il ne les remplace pas. Un badge élevé **ne confère pas** de rôle officiel McBuleli.

---

## 1. Objectifs

- Soutenir la croissance de McBuleli
- Développer la communauté
- Identifier les futurs leaders locaux
- Fidéliser les utilisateurs actifs
- Créer un système de réputation durable (au-delà des BP purs)

---

## 2. Niveaux (badges)

| Niveau | Code | Seuil BP / activité | Statut |
|--------|------|---------------------|--------|
| Bronze | `bronze` | TBD | Draft |
| Silver | `silver` | TBD | Draft |
| Gold | `gold` | TBD | Draft |
| Diamond | `diamond` | TBD | Draft |
| Platinum | `platinum` | TBD | Draft |

**Durée :** chaque badge est valable **24 mois**. À l’expiration : renouvellement, changement de niveau, ou sortie. Les avantages expirent avec le badge.

**Conservé après expiration :** historique, réputation, McB déjà claimés / reçus.

---

## 3. Avantages (cadre - à chiffrer avant lancement)

Selon le niveau, un membre **peut** bénéficier de (liste indicative) :

- Réductions de frais (MM, swap, retraits) - **plafonnées** et rentables pour McBuleli
- Support prioritaire
- Accès anticipé / bêta
- Academy Premium (durée limitée)
- Événements privés
- Avantages liés au McB **dans le respect du cadre juridique** (utility only)

**Règle économique :** aucun avantage n’est publié tant que le modèle de coût/marge n’est pas validé (finance + produit).

---

## 4. Lien avec Buleli Points (BP)

Les BP alimentent la réputation et l’éligibilité MBP. Sources déjà live (code) :

- KYC, email, staking, P2P, Academy, Community, bots (voir `reward-points-config.ts`)

Sources prévues (roadmap) : parrainage, contribution dev, événements MBP.

Le McB **n’accorde pas** automatiquement un statut Builder.

---

## 5. Gouvernance communautaire (trois couches)

| Rôle | Accès | Qui décide |
|------|-------|------------|
| **Builder** | Badge + avantages programme | Règles automatiques (seuils) |
| **Ambassadeur** | Candidature | Sélection McBuleli (charte + KYC + activité) |
| **Représentant officiel** | Nomination | McBuleli uniquement |

Investissement ou badge élevé **ne garantit jamais** un rôle officiel.

### Ambassadeurs (conditions cibles)

- Badge minimum (TBD)
- KYC validé
- Activité régulière
- Formation interne
- Signature d’une charte

### Représentants officiels

Mission : représenter l’entreprise, développer la communauté locale, événements, partenariats. Mandat **indépendant** du badge (éligibilité minimum possible).

Expiration badge → période de transition + réévaluation pour ambassadeurs / représentants.

---

## 6. Points ouverts avant go-live produit

1. Nature juridique du programme (conformité pays ciblés)
2. Seuils exacts Bronze → Platinum
3. Règles d’attribution BP → score MBP (vs solde BP brut)
4. Modèle économique des avantages (plafond coût plateforme)
5. Modalités de renouvellement à 24 mois
6. Interaction tokenomics McB ↔ BP ↔ badge

---

## 7. Implémentation technique (après validation)

Comble la lacune **G9** (badges / réputation Community) :

| Étape | Livrable |
|-------|----------|
| M1 | Tables `community_badges` / `builders_memberships` + migration |
| M2 | Score dérivé du ledger BP (fenêtre glissante 24 mois) |
| M3 | UI `/app/community` + profil public |
| M4 | Perks liés aux niveaux (réutiliser `reward_point_perks` si possible) |
| M5 | Charte ambassadeur + admin nomination représentants |

**Ne pas** marketing-lancer MBP tant que M1–M3 ne sont pas en prod et que le point juridique (1) n’est pas clos.

---

## 8. Message public (whitepaper)

Publier uniquement : vision, niveaux nommés, durée 24 mois, distinction Builder / Ambassadeur / Représentant, et le fait que les **seuils sont à définir**. Pas de tables de discounts chiffrés tant qu’ils sont TBD.
