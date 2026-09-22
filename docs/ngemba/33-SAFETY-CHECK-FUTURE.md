# NGEMBA Safety Check — vision différée

> Date : **15 septembre 2026**  
> Statut : **documenté, non planifié pour implémentation immédiate**  
> Décision : reporter jusqu’à solidification du pilote SOS / ops / observatoire

---

## 1. Pourquoi plus tard

NGEMBA est aujourd’hui centré sur l’**alerte individuelle** :

`citoyen → SOS / témoin / discret → triage IA → Response Engine → dossier ops`

Safety Check suppose une couche **crise collective** (événement géolocalisé, scope, population éligible, notification contextuelle). Or aujourd’hui :

| Prérequis | État actuel |
|-----------|-------------|
| Entité « crise » multi-personnes | ❌ absent (`alert_sessions` = 1 alerte) |
| Push / présence citoyenne | ❌ cookie anonyme + PWA sans push |
| Scope géographique opérationnel | ⚠️ communes / GPS ponctuel seulement |
| Activation mass notify contrôlée | ❌ pas de blast ; notify proches limité (discret extrême) |
| Observatoire k-anonyme | ✅ utile comme **signal**, pas comme déclencheur auto |

Implémenter maintenant = risque de sur-ingénierie, faux blasts, et distraction du cœur produit (SOS fiable + orientation partenaires).

**Règle :** documenter maintenant · coder quand les prérequis ci-dessous sont verts.

---

## 2. Concept (rappel)

Trois notions distinctes — **ne pas fusionner** :

| Concept | Rôle |
|---------|------|
| **CRISE** | Événement collectif (incendie, inondation, incident armé…) dans une zone |
| **SAFETY CHECK** | Question contextuelle : « Êtes-vous en sécurité ? » |
| **SOS** | Demande d’intervention individuelle (parcours existant) |

Flux cible :

```text
CRISE (vérifiée / ops)
  → SCOPE (communes / rayon — pas toute la ville par défaut)
  → SAFETY CHECK (in-app d’abord)
  → SAFE | DANGER | NEED_HELP
       ├── SAFE → statut perso (+ proches opt-in)
       ├── DANGER → SOS existant avec contexte crise
       └── NEED_HELP → flux court → Response Engine / ops
```

Philosophie inchangée : *« Une personne en danger ne devrait pas avoir à comprendre le système… »* — le check est **proactif et simple** ; la complexité reste côté NGEMBA.

---

## 3. Prérequis avant de coder

1. **Pilote SOS stable** en production (création, triage, dossier, SLA).
2. **Postgres primary** fiable pour sessions (`NGEMBA_SESSION_PRIMARY=postgres`) + migrations VPS.
3. **Ops RBAC** utilisable pour une permission « activer Safety Check » (audit existant `ng_audit_access_log`).
4. **Décision canal** : au minimum bandeau in-app + deep link ; push/SMS massif = phase ultérieure.
5. **Protocole humain** : qui peut déclarer une crise, seuils de vérification, wording non paniquant (aligné [05-PROTOCOLE-OPERATEUR.md](./05-PROTOCOLE-OPERATEUR.md) + juridique [04](./04-NOTE-JURIDIQUE-BROUILLON.md)).
6. **Alignement proches** : notify uniquement **opt-in citoyen** ([19-PHILO-ORIENTATION-PROCHES.md](./19-PHILO-ORIENTATION-PROCHES.md)).

---

## 4. MVP quand on y reviendra (Vague A)

### Inclure

- Table / store `Crisis` + `CrisisScope` (communes[] + rayon optionnel ; `geojson` nullable pour plus tard).
- Statuts crise réduits : `VERIFYING | ACTIVE | RESOLVED | CANCELLED` (+ `expiresAt`).
- `SafetyStatus` : `SAFE | DANGER | NEED_HELP | UNKNOWN` avec historique + `idempotencyKey`.
- Activation **ops uniquement** (`safetyCheckEnabled`) + audit who / when / scope / why.
- Écran citoyen 3 gros boutons (i18n 6 langues).
- Pont **DANGER → SOS** : `source: safety_check` + `routingMeta.crisisId` (ne pas remplacer `SosFlow`).
- NEED_HELP : catégories courtes (médical, évacuation, abri, transport, famille, autre) + texte/voix.
- Agrégats ops privacy-preserving (counts, pas d’identités / positions exactes publiques).
- Anti-spam : cooldown par `(crisisId, citizenToken)`.
- Éligibilité **sans tracking continu** : GPS ponctuel à l’ouverture si permission, sinon commune / zones suivies optionnelles.

### Exclure du MVP

- Push FCM / SMS massifié / USSD.
- Polygones Zone A/B/C et moteur géo avancé.
- Corrélation IA automatique multi-rapports → crise confirmée (suggestion ops OK).
- Notify auto de toute une ville.
- Bouton Safety Check permanent sur la home.
- Carte publique des personnes en danger.
- Comptes citoyens obligatoires.
- Analytics opérationnels complets.

### Vague B / C (plus tard encore)

- Expansion de scope + notify des **nouveaux** éligibles seulement.
- Abonnements « ma commune ».
- Suggestion IA de regroupement d’alertes.
- Push / SMS / polygones / USSD.

---

## 5. Réutilisation du code existant

| Brique | Réemploi |
|--------|----------|
| `alert_sessions` / `POST /api/alerts` | SOS contextualisé depuis DANGER |
| Response Engine | NEED_HELP / DANGER → files existantes |
| Trusted contacts | Opt-in « informer un proche » (SAFE / HELP) |
| Observatory | Signal ops pour *proposer* une crise, pas auto-blast |
| `requireOpsAuth` + audit | Gate activation |
| `notify.ts` / Resend / SMS | Canaux déjà branchés (proches / ops) |
| i18n `messages` | Copie Safety Check 6 langues |
| Design tokens / gros CTA | Même UI SOS |

---

## 6. Risques produit (à relire avant code)

- Sans push, beaucoup de citoyens ne voient le check qu’en ouvrant l’app → le MVP doit l’assumer.
- Un mauvais scope = panique ou fatigue de notification.
- Confusion CRISE / SOS si l’UX n’est pas ultra claire.
- Notify proches sans opt-in = risque agresseur / stigmatisation (doc 19).

---

## 7. Lien avec le plan maître

Safety Check relève du pilier **VIGILER / PRÉVENIR** à l’échelle zone, **après** le pilier **PROTÉGER** (SOS individuel).  
Voir [PLAN-MAITRE.md](./PLAN-MAITRE.md) §1.3 et Phase 5 (ville / institutions) — ce module est un candidat **post–Phase 5 / Phase 6**, pas un remplacement du Dispatch Engine.

Avancement : [08-AVANCEMENT.md](./08-AVANCEMENT.md) § « Plus tard ».
