# McBuleli Constitution Lite - Outline (public v1.0)

> **Statut :** outline de la page publique `https://mcbuleli.org/whitepaper`  
> **Version :** 1.0 · juillet 2026  
> **Sources :** code live · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md) · [builders-program-spec.md](./builders-program-spec.md) · [social-utility-graph.md](./social-utility-graph.md)

**Règle d’édition :** chaque phrase publique est soit un **fait live**, soit marquée **roadmap / draft**. Aucune promesse de prix, d’APY token, ni d’ICO.

---

## Structure publiée (11 sections)

| # | Section | Contenu | Fait / Draft |
|---|---------|---------|--------------|
| 0 | Couverture | Tagline, v1.0, date | Fait |
| 1 | Lettre du fondateur | Pourquoi McBuleli, Afrique | Fait (éditorial) |
| 2 | Executive summary | Problème / solution / vision | Fait (produit live) |
| 3 | Principes fondateurs | Checklist conformité futures features | Fait (constitution) |
| 4 | Écosystème | Modules live + « en construction » | Mixte |
| 5 | Architecture financière | Capital → … → Conformité | Fait (cadre) |
| 6 | Économie McBuleli | BP / McB / USDT-PI | Mixte |
| 7 | Builders Program | Vision MBP, niveaux, 24 mois | **Draft** |
| 8 | Sécurité & conformité | KYC, escrow, utility-only | Fait |
| 9 | Roadmap | Court / moyen / long | Roadmap |
| 10 | FAQ + Conclusion | Questions + vision | Mixte |

Chapitres tech détaillée, business model exhaustif, annexes API : **v1.1+** (internes pour l’instant).

---

## Faits vérifiés (live)

| Affirmation | Preuve |
|-------------|--------|
| Wallet custodial USDT / PI | App `/app/wallet` |
| P2P escrow + mobile money | `/app/p2p` |
| Staking USDT / PI | `/app/wallet/staking` |
| Academy (cohortes, lives, quiz, BP) | `/app/academy` |
| Community hub (feed, blogs, Q&A, BP) | `/app/community` |
| Bots / futures / options | `/app/trade/*` |
| AVEC groupes | `/app/wallet/groups` |
| KYC Didit | `/app/profile/kyc` |
| BP ledger + cap 4 000 / mois | `REWARD_MONTHLY_EARN_CAP` |
| Ratio claim 100 BP = 1 McB | `REWARD_BP_PER_MCB_CLAIM` |
| Spend BP : P2P −15 %, bot renew −10 % | `REWARD_SPEND` |
| Contrat BEP-20 + claim portal | `McBuleliToken.sol`, `/admin/mcb-claims` |
| Pas d’ICO / utility-only (policy produit) | docs token + UI disclaimer |

---

## Draft / roadmap (à ne pas présenter comme live)

| Élément | Statut |
|---------|--------|
| Allocation supply 40 / 35 / 15 / 10 % | **Proposition v1** (à valider fondateur) - publiée comme proposition |
| Supply max 100M McB | Alignée constructeur contrat (exemple deploy) |
| Frais payables en McB (−25 %) + burn 30 % | Roadmap Phase C |
| Staking McB, gouvernance votes | Roadmap long terme |
| Builders Program seuils Bronze→Platinum | Draft - [builders-program-spec.md](./builders-program-spec.md) |
| Ambassadeurs / représentants | Draft gouvernance communautaire |
| Banque numérique, assurance, crédit | Horizons long terme - pas engagements produit |
| Liquidité DEX 30–50k USD, CoinGecko | Phase 4 roadmap |

---

## Allocation supply (proposition v1 - en attente validation formelle)

| Allocation | % | Notes |
|------------|---|-------|
| Émission via claim BP | 40 % | Liée à l’utilité réelle |
| Réserve écosystème (LP, rewards) | 35 % | Trésorerie ops |
| Équipe / ops | 15 % | Vesting 4 ans (cible) |
| Partenariats | 10 % | - |
| **Supply max** | **100M McB** | BEP-20 BSC |

Toute modification de % doit mettre à jour ce fichier, `mcb-tokenomics-reference.md`, et la page `/whitepaper` en même temps (semver Constitution).

---

## Principes immuables (checklist produit)

1. **Afrique d’abord** - use cases RDC / mobile money / inclusion.
2. **Utility only** - pas de promesse de prix ni de rendement du jeton.
3. **Pas d’ICO** - émission liée à l’usage (BP → McB), pas à une vente publique speculative.
4. **KYC pour crypto sensible** - withdraw / claim McB gated.
5. **Architecture financière** - Capital → Liquidité → Communauté → Token → Gouvernance → Conformité.
6. **Transparence** - paramètre chiffré = code ou tagué draft.
7. **Soutenabilité** - avantages MBP / discounts doivent rester économiquement viables.
8. **Sécurité des fonds** - escrow P2P, ledger auditable, hardening OPS.

Test future feature : *« Est-ce conforme à ces principes ? »*

---

## Liens publics

- Page : `/whitepaper`
- Interne tokenomics : [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md)
- Ops lancement : [mcb-token-ops-launch.md](./mcb-token-ops-launch.md)
- MBP : [builders-program-spec.md](./builders-program-spec.md)
