# Cartographie rôles communauté McBuleli

> **Statut :** proposition produit (pré-scale McB BSC)  
> **Dernière révision :** juillet 2026  
> **Liés :** [builders-program-spec.md](./builders-program-spec.md) · [builders-perks-economics.md](./builders-perks-economics.md) · [social-utility-graph.md](./social-utility-graph.md) · [mcb-tokenomics-reference.md](./mcb-tokenomics-reference.md)

**Objectifs :** (1) donner de la **valeur à McB**, (2) créer un **sentiment d’appartenance**, (3) installer de la **responsabilité**.

**Règle d’or :** acheter du McB ou un badge élevé **ne confère jamais** un mandat officiel. Les privilèges liés au badge **tombent** si non renouvelés après 24 mois. Les rôles à charte se **réévaluent** ; ils ne s’achètent pas.

---

## 0. Ordre (tout est ordonné ainsi)

```
1. Effort (BP / qualité)     →  Réputation : Membre → … → Pillier
                                    │  (label only — pas de mandat entreprise)
2. McB (claim ou DEX)        →  Badge Builder Bronze→Platinum  (= noblesse)
                                    │
3. Gold ou Platinum actif    →  Éligibilité soft aux candidatures terrain
                                    │
4. Charte / nomination       →  Ambassadeur, Rep. régional, Rep. officiel…
                                    │  (seuls rôles qui engagent McBuleli)
```

| Concept | Responsabilité entreprise ? | Comment on l’obtient |
|---------|----------------------------|----------------------|
| **Pillier** (score) | **Non** - prestige d’effort | Score ≥ 600 auto |
| **Builder Gold+** | **Non** - privilèges produit | Paiement McB + KYC |
| **Ambassadeur** (charte) | **Oui** - représente sous charte | Candidature + critères (dont Gold+) |
| **Rep. officiel / régional** | **Oui** - engage la marque sur le terrain | Nomination McBuleli |

→ On **garde** le mot **Ambassadeur** uniquement pour le mandat à charte.  
→ Le top score est renommé **Pillier** / *Pillar* (code : `pillar`, ex-`ambassador`).

---

## 1. Deux portes d’entrée

| Porte | Accès | Qui décide | Expire avec le badge 24 mois ? |
|-------|--------|------------|--------------------------------|
| **A — Privilèges MBP** | Tier Bronze→Platinum actif | Paiement McB + règles auto | **Oui** (perks + badge) |
| **B — Mandats** | Candidature / nomination | Charte + McBuleli | **Non** (réévaluation séparée) |

---

## 2. Porte A — Privilèges liés au badge (auto)

Pas de charte. Visible, compréhensible, **raison de renouveler** en McB.

| Tier | Rôle produit | Privilèges (cadre — à chiffrer) | À l’expiration |
|------|--------------|--------------------------------|----------------|
| Bronze / Silver | Builder | Badge, early soft, support standard+ | Perte badge + perks |
| **Gold** | Builder Gold | Priority queue, Academy soft perk, boost quota↑, salon Gold | Idem |
| Diamond | Builder Diamond | Beta SUG, tip/boost caps↑, events privés | Idem |
| **Platinum** | Builder Platinum | Conseil Builders (voix soft), early ads créateur, concierge | Idem + perte siège conseil |

**Conservé après expiration :** historique Builder, McB déjà détenus, BP, badges *earned* (top trader, etc.).

---

## 3. Porte B — Mandats (charte / nomination)

**Critères d’entrée (noblesse d’abord) :** KYC + badge Builder **Gold minimum** (sauf Gardien staff) + activité / formation selon le rôle. Sans statut Builders Gold+, pas de candidature terrain qui engage l’entreprise.

| Rôle | Qui décide | Mission | Lien MBP / McB |
|------|------------|---------|----------------|
| **Ambassadeur** | Candidature + charte | Croissance locale, onboarding, crédibilité | **Gold+ obligatoire** (critère) |
| **Représentant officiel** | Nomination McBuleli | Parler au nom de la marque, partenariats | Gold+ recommandé ; mandat ≠ badge |
| **Rep. régional** | Nomination + charte | Couverture geo (ville / province / pays) | Après Ambassadeur prouvé |
| **Mentor Community** | Charte + activité | Q&A, aide P2P/AVEC, anti-arnaque | Silver+ + BP qualité |
| **Animateur Community** | Charte (≠ host Academy Live) | Lives, spaces, rituels d’appartenance | Gold+ recommandé |
| **Créateur vérifié** | Charte créateur | Contenu utile, affiliate, Creator Fund | KYC ; tips/ads McB |
| **Signal Steward** | Charte + track record | Qualité signaux / anti-pump | Gold+ + quality score |
| **Gardien (Mod)** | Nomination staff | Modération, safety, reports | Pas de badge requis |

### Rôles proposés (nouveaux) pour solidifier

| Besoin | Rôle | Effet |
|--------|------|--------|
| Appartenance | Animateur Community, Host Local Meetup, Story Keeper | Rituels, récits, « on construit ensemble » |
| Responsabilité | Mentor, Gardien, Signal Steward | Confiance → usage réel de l’app |
| Valeur McB | Builder Gold+, Créateur vérifié | Sinks + raisons de détenir McB |
| Terrain | Rep. régional, Ambassadeur, **Campus Lead** | Geo + cohortes Academy |
| Partenariats | **Angel Partner** | Hors MBP : allocation / partenariat stratégique (tokenomics), **pas** un palier achetable |

**Ne pas confondre :** « Animateur » Academy Live (Jitsi host) ≠ Animateur Community.

---

## 4. Matrice objectifs

| Levier | Mécanisme | Effet McB | Effet humain |
|--------|-----------|-----------|--------------|
| Badge MBP | Payer / renouveler McB | Sink + demande DEX | Statut, fierté |
| Perks Gold+ | Auto si tier actif | Raison de renouveler | Peur de perdre l’accès |
| Charte | Mission + accountability | Crédibilité → usage | Responsabilité |
| Nomination | Confiance McBuleli | Partenariats / geo | Leadership local |
| BP qualité | Effort gratuit | Pipeline claim → MBP | Habitude d’utilité |

---

## 5. Ordre avant scale McB BSC

1. ~~Renommer le label score Ambassadeur → Pillier~~ **fait** (`reputation-levels.ts`).
2. ~~Chiffrer perks Gold / Platinum~~ **brouillon** — [builders-perks-economics.md](./builders-perks-economics.md) (attente signature finance).
3. Soft non monétaire d’abord (salon, badge, éligibilité Ambassadeur Gold+), puis remises frais avec CAP.
4. Charte Ambassadeur + Mentor + Animateur Community (Gold+ requis).
5. Nomination Rep. régional / officiel après 1–2 Ambassadeurs prouvés par zone.
6. Angel Partner : process partenariats / tokenomics — **jamais** un bouton d’achat badge.

---

*Document de travail produit. Toute activation de perks chiffrés doit passer finance + conformité avant marketing.*
