# NGEMBA SYSTEM AUDIT - Infrastructure nationale

> Date : **5 septembre 2026**  
> Scope : `services/ngemba/` + `services/ngemba-mobile/` + `docs/ngemba/`  
> Methode : inspection code + docs + alignement vision OpenAI (`gpt-4o`)  
> Regle : **aucun code produit ici** - audit et architecture cible seulement

---

## Verdict

NGEMBA est deja une **plateforme d'alerte, de triage IA et d'orientation multi-acteurs** (pilote RDC), pas encore une **infrastructure de dispatch operationnel**.

Le socle citoyen + IA + OPS + partenaires + SLA est **reutilisable**.  
Le goulot critique : **persistance JSON fichier** + **absence d'OperationalUnit / Response Engine** + **RBAC tokens plats**.

Philosophie actuelle documentee : *informer et orienter*.  
Vision cible : *dispatch intelligent multi-services*.  
Transition possible **sans destruction**, par phases.

---

## 1. Architecture actuelle

```
Citoyen (PWA Next / Expo)
    |
    v
API Next.js (/api/alerts, media, me, youth, location, ops/*, observatory)
    |
    +-- Ngemba IA (local | hybrid | openai) -> triage Zod
    +-- Regles applyTriageRules -> routingQueue
    +-- Partenaires seed (zone + categorie)
    +-- SLA + escalade file nationale
    |
    v
Store runtime : data/sessions.json  (+ media local / R2)
Ops UI : /ops, /ops/[id], /ops/partners, /ops/observatory
SSE : /api/ops/stream
Email : Resend
```

**Isolation :** service separe du monorepo McBuleli fintech (`services/ngemba/`).  
**Deploy :** VPS CyberAlert `153.75.235.176:3012` · domaine `ngemba-rdc.org`.

---

## 2. Stack technique

| Couche | Choix | Statut |
|--------|-------|--------|
| Web | Next.js 16 App Router + React 19 + Tailwind 4 | KEEP |
| Mobile | Expo (`ngemba-mobile`) | KEEP |
| ORM | Drizzle + schema v0 | IMPROVE (quasi mort runtime) |
| DB | Postgres client optionnel (`DATABASE_URL`) | REPLACE usage reel |
| Persist alertes | **JSON file** `sessions/store.ts` | REPLACE |
| IA | OpenAI + triage local + Zod | KEEP / IMPROVE |
| Fichiers | R2 (+ fallback disque) | KEEP |
| Cartes | Leaflet / OSM (agregats) | KEEP |
| Auth ops | Tokens env + cookies httpOnly | REFACTOR |
| Auth citoyen | Cookie appareil | IMPROVE |
| i18n | FR EN LN SW LU KG | KEEP |
| Notifs | Email Resend + SSE + webhooks optionnels | IMPROVE |

---

## 3. Fonctionnalites existantes

### Citoyen

- Accueil SOS-first (SVG, textes courts)
- SOS / temoin / ecole / mode discret / jeunesse / ressources / prevenir
- GPS optionnel + lieu manuel (provinces / communes)
- Session alerte + medias + chat
- Compte leger appareil (`/me`)
- Contacts de confiance (1-3, pas notify auto)
- PWA + APK Expo pilote

### IA

- Triage structure (categorie, urgence, danger, resume, missing_info, routing_hint)
- Modes `local` / `hybrid` / `openai`
- Fallback keyword si API indisponible
- Polish texte + Whisper optionnel
- Garde-fous : pas de culpabilite / pas de preuve authentifiee

### Ops

- Login token par role
- File filtree (mandat + zone partenaire)
- Dossier + notes + assignation + orientation
- Annuaire partenaires
- SLA + escalade nationale
- Observatoire heatmap k-anonyme + export
- Charts SVG

### Hors scope actuel (confirme code)

- OperationalUnit
- ETA / capacite live
- Dispatch multi-unite
- USSD / SMS gateway unifie
- ABAC / accreditation DB
- Lifecycle ACK / EN_ROUTE / ON_SCENE
- Audit log d'acces persistant complet

---

## 4. Flux utilisateur actuel

```
SOS / temoin / shake / school
  -> message (+ lieu optionnel)
  -> runTriage
  -> createSession (JSON)
  -> routingMeta partenaires
  -> slaDueAt
  -> notify ops (email)
  -> citoyen : ecran session
  -> ops : file / dossier
  -> statut oriented | closed | cancelled
  -> si SLA depasse : escalade nationale
```

**Alignement vision :** alerte rapide + verification progressive = **oui** (message court, medias apres).  
**Ecart :** pas de boucle intervention unitaire temps reel.

---

## 5. Architecture des donnees

### Schema Drizzle (`src/db/schema.ts`)

Tables declarees :

- `ng_users`
- `alert_sessions` (status, urgency, category, GPS, ai_*, routing_queue, ...)

Enums : `opened|active|oriented|closed|cancelled` · urgences · sources.

### Draft doc (`02-SCHEMA-DB-DRAFT.md`) - non implemente runtime

- `alert_messages`, `alert_media`, `alert_routing`
- `ngo_orgs`, `ngo_members`
- `audit_access_log`
- `aggregated_incidents`

### Runtime reel

`AlertSessionRecord` enrichi en memoire/JSON :

- media[], chatMessages[], trustedContacts, schoolContext
- routingMeta, slaDueAt, escalation, statusHistory
- citizenToken, clientIp, discreteMode

**Ecart critique :** le modele riche vit dans un fichier ; Postgres n'est pas la source de verite des alertes.

---

## 6. Authentification

| Acteur | Mecanisme | Limites |
|--------|-----------|---------|
| Citoyen | Cookie `citizen` appareil | Pas d'identite forte ; partage appareil = risque |
| Ops | Bearer / cookie + token env par role | Pas d'utilisateurs individuels en DB |
| Partenaire | Token env optionnel (`tokenEnv`) | Binding org fragile |
| MFA | Absent | NEW / IMPROVE comptes institutionnels |

---

## 7. RBAC actuel

Roles : `admin` | `ngo` | `security` | `partner` | `school`

Permissions plates : `alerts.list|view|patch|stats`, `stream.subscribe`, `observatory.view|export`

Filtres :

- Mandat categorie / queue (`sessionMatchesRoleMandate`)
- Couverture geo partenaires (`sessionInRoleCoverage`)

**Classification :** RBAC simple + **ABAC geo/categorie embryonnaire**.  
Pas d'accreditation, expiration, revocation, separation acces preuve / PII / analytics.

---

## 8. Securite actuelle

Implemente :

- Rate limit create alert + login ops
- Headers securite / nginx / Cloudflare
- Timing-safe tokens (pattern ops)
- Minimisation citoyen (anonyme possible)
- Pas de carte victimes
- Sanitize citizen vs ops

Risques :

- Store JSON sur disque VPS (perte / fuite volume)
- Tokens partages = pas d'attribution individuelle forte
- Pas d'audit access log durable
- Chiffrement media application-level partiel
- IDOR media a revalider systematiquement (tests)

---

## 9. Gestion des alertes actuelle

| Aspect | Etat |
|--------|------|
| Creation | API-first `POST /api/alerts` |
| Lifecycle | opened → active → oriented → closed (+ cancelled) |
| Timeline | `statusHistory` basique |
| Assignation | `assignedTo` texte |
| Escalade | elargissement file + event, pas redispatch unites |
| Multi-agency | non |

---

## 10. IA actuelle

| Element | Detail | Classe |
|---------|--------|--------|
| Prompt systeme | Protection RDC, multilangue | KEEP |
| Schema Zod | Structure validee | KEEP |
| `applyTriageRules` | Bridge IA → files | IMPROVE → Response Engine |
| Hybrid local | Cout / resilience | KEEP |
| Separation AI / Engine | Partielle (regles dans meme module) | REFACTOR |

OpenAI alignement : *IA recommande ; moteur applique ; humains pour decisions sensibles* - deja dans l'esprit, a **formaliser** en module `response-engine/`.

---

## 11. Geolocalisation actuelle

- GPS consentement explicite
- Reverse Geoapify + fallback national RDC
- Commune / label / accuracy
- Mode sans GPS (province / ville / commune)
- Pas de tracking permanent

Aligne vision survivor-centered. Manque : geofencing ops unites, ETA trafic.

---

## 12. Notifications actuelles

- Email ops (Resend)
- SSE ops stream
- Webhooks optionnels
- SMS hook env present (Africa's Talking / webhook) - pas canal citoyen unifie
- Contacts confiance : actions manuelles ops (`wa.me`) - pas auto

---

## 13. Gestion des medias

- Photo / audio / video
- R2 + fallback local
- Transcription Whisper optionnelle
- Lie a la session
- Manque : chiffrement bout-en-bout, policy retention cron, audit download, separation declaration / analyse IA / verification humaine formalisee

---

## 14. Dashboards existants

| Surface | Contenu |
|---------|---------|
| `/ops` | File + stats + SLA |
| `/ops/[id]` | Dossier + routing + proches |
| `/ops/partners` | Annuaire |
| `/ops/observatory` | Heatmap agregee |
| Citoyen `/me` | Ses alertes |

Manque OPS cible : unites live, carte interventions permissionnee, TTFA/TTA/TTE/TTAI/TTR.

---

## 15. Problemes critiques

1. **Persistance JSON** - non scalable, fragile multi-instance, backup/restore faibles
2. **Schema Drizzle orphelin** - double verite
3. **Pas de Response Engine** - routing = match liste + file humaine
4. **Pas d'unites operationnelles** - impossible scoring ETA/capacite
5. **Auth ops token** - pas d'accreditation individuelle
6. **Lifecycle trop court** pour coordination terrain
7. **Observabilite metriques dispatch** absente

---

## 16. Dette technique

- Store fichiers vs DB
- Partenaires hardcodes / JSON env (OK pilote, limite national)
- Categories enum hardcode frontend + Zod (extensible partiel)
- SSE in-process (pas Redis / bus)
- Tests securite IDOR / privilege peu systematises
- Doc Phase 0-5 en avance sur maturite "infrastructure"

---

## 17. Fonctionnalites contradictoires avec la vision

| Existant | Tension |
|----------|---------|
| Philo "pas de dispatch police auto" | Vision veut dispatch multi-service |
| Orientation info-only medical/urgence | Vision veut intervention + suivi |
| Roles 5 tokens | Vision 18 categories d'acteurs |
| Status oriented = fin ops | Vision veut EN_ROUTE / ON_SCENE |
| Observatoire institution | OK - ne pas le transformer en surveillance |

**Resolution :** garder la contrainte legale/humaine ; ajouter dispatch **semi-auto** avec ack humain pour forces de l'ordre.

---

## 18. Classification KEEP / IMPROVE / REFACTOR / REPLACE / REMOVE / NEW

### KEEP

- Parcours SOS minimal + GPS optionnel
- Triage IA structure + disclaimer
- i18n 6 langues + SVG UI
- Mode discret (avec limites OS documentees)
- Safe School + Jeunesse
- Observatoire k-anonyme
- Isolation service / domaine
- Stack Next + Expo + OpenAI + R2
- SLA concept + notify ops
- Philosophie proches ≠ dispatch primaire

### IMPROVE

- `applyTriageRules` → moteur de politiques versionne
- Annuaire partenaires (DB + verification)
- Timeline evenements riches
- Rate limit / WAF / backups
- MFA ops
- Metriques TTFA / TTA / TTR
- Tests securite automatises

### REFACTOR

- Sessions JSON → Postgres (migration douce)
- Roles tokens → users + org + accreditation + ABAC
- Lifecycle alertes → cycle intervention
- Modules `ai/` vs `response-engine/`
- Channels (app/ussd/sms/call) → meme Incident API

### REPLACE

- Source de verite `sessions.json` par tables Postgres
- Assignation texte libre par Assignments / Dispatches structures

### REMOVE (apres migration + preuve d'inutilite)

- Rien a supprimer aveuglement
- Candidates : doublons UI "Parler" deja retires ; notify auto proches (deja retire) ; chemins morts si identifies en migration

### NEW

- `OperationalUnit` + statuts disponibilite
- Dispatch Engine (auto / semi / manuel)
- Multi-agency response
- Accreditation + expiration
- Categories configurables DB
- USSD/SMS gateway abstraction
- Carte ops permissionnee (pas publique victimes)
- Prevention analytics (anomalies zones/horaires)
- Channel adapters omnicanaux

---

## 19. Fonctionnalites a ameliorer

- Persistance et transactions
- RBAC/ABAC
- Escalade multi-niveaux (local → national → centre ops)
- Scoring partenaires (au-dela de zone+categorie)
- Audit trail
- Fake-alert scoring progressif (sans bloquer vraies urgences)

---

## 20. Fonctionnalites manquantes (vision)

- Response Engine central
- OperationalUnit + ETA + capacite
- Dispatch / reassign / timeout / ack
- Statuts intervention terrain
- ABAC attributaire complet
- Annuaire referral medical/juridique/psychosocial formalise
- USSD multi-operateurs
- Hotline / call-center adapter
- Centre coordination ministeriel (vue strategique anonymisee)
- Encryption + retention media policy

---

## 21. Architecture cible recommandee

```
Channels: App | USSD | SMS | Hotline | Web | Voix
                |
                v
         Incident API (unique)
                |
        +-------+--------+
        |                |
   Ngemba AI        Response Engine
   (comprendre)     (regles autorisees)
        |                |
        +-------+--------+
                |
     Organizations / Accreditations / ABAC
                |
     OperationalUnits + Service Directory
                |
     Dispatch / Assignment / Escalation
                |
     OPS Dashboard + Realtime (SSE/WS)
                |
     AuditLog + Metrics + Prevention (agregats)
```

**Invariants non negociables :**

- Survivor-centered, least privilege
- IA ne declare ni culpabilite ni preuve
- Pas de surveillance permanente
- Pas de pins victimes publics
- Humain pour actions irreversibles / forces de l'ordre

---

## 22. Nouveau modele de donnees propose (delta)

Ne pas tout creer d'un coup. Etendre depuis `alert_sessions` :

| Entite | Role | Phase |
|--------|------|-------|
| `incidents` | Alias evolutif de `alert_sessions` (ou rename soft) | 1 |
| `incident_events` | Timeline immutable | 1 |
| `incident_categories` | Catalogue configurable | 1 |
| `organizations` | Remplace seed partenaires | 3-4 |
| `organization_members` | Comptes individuels | 3 |
| `accreditations` | Niveau, zone, expiration | 3 |
| `permissions` / policies ABAC | Attributs | 3 |
| `services` + `referrals` | Annuaire orientation | 4 |
| `operational_units` | Unites terrain | 5 |
| `unit_capabilities` | Competences / capacite | 5 |
| `dispatches` | Demandes de prise en charge | 6 |
| `assignments` | Affectation unite↔incident | 6 |
| `audit_logs` | Acces et decisions | 1+ |
| `channel_messages` | USSD/SMS ingress | 9 |
| `risk_scores` | Abus / fiabilite (non bloquant urgence) | 2+ |

Champs incident a ajouter progressivement :

- `sensitivity_level`
- `required_services[]`
- `people_at_risk` (structure minimale)
- `channel` (`app|ussd|sms|hotline|...`)
- etats intervention etendus (sans casser enums existants - table de mapping)

---

## 23. Nouveau modele RBAC / ABAC

### Identite

`User` → `OrganizationMember` → `Accreditation` → `Role` + `Attributes`

### Roles (evolution des 5 existants)

Garder les 5 comme **profils de demarrage**, mapper vers categories :

| Actuel | Cible |
|--------|-------|
| admin | admin_national + ops_center (scopes separes) |
| ngo | org_operator / org_admin |
| security | security_unit / dispatcher |
| partner | partner_viewer / infra |
| school | school_referent |

### Attributs ABAC

- organisation, fonction, territoire, type incident, sensibilite
- niveau accreditation, mandat, statut, relation au dossier
- fenetre temporelle (garde), canal

### Separation des acces

- operationnel ≠ administratif ≠ analytique ≠ PII ≠ preuves

Un admin systeme **ne recoit pas** automatiquement toutes les PII.

---

## 24. Nouveau modele Incident

Lifecycle cible (compatible migration) :

```
REPORTED (= opened)
RECEIVED
ANALYZING
TRIAGED
ASSIGNED
ACKNOWLEDGED
EN_ROUTE
ON_SCENE
ASSISTANCE_IN_PROGRESS
RESOLVED
CLOSED
+ CANCELLED | DUPLICATE | REJECTED | ESCALATED | REASSIGNED
```

Mapping interim :

- `opened/active` → REPORTED..TRIAGED
- `oriented` → ASSIGNED..ASSISTANCE (jusqu'a enrichissement)
- `closed` → RESOLVED/CLOSED

Chaque transition → `incident_events` + actor + raison.

---

## 25. Nouveau modele OperationalUnit

Attributs :

- organisation_id, type, competences[], capacite
- status : AVAILABLE | ASSIGNED | EN_ROUTE | ON_SCENE | BUSY | OFFLINE | UNAVAILABLE
- position, zone_ops, accreditation_level
- last_heartbeat, reliability_score

**Couverture operationnelle ≠ juridiction administrative.**

---

## 26. Nouveau modele Dispatch

Flux :

```
Incident classe
 → required_services
 → candidats (competence + juridiction/couverture + dispo)
 → score configurable (ETA, distance, capacite, priorite, fiabilite, accreditation)
 → mode auto | semi | manuel
 → assignment
 → ack timeout → escalade / reassign
 → multi-dispatch si multi-risque
 → journal complet
```

Modes :

- automatic (info / infra basse sensibilite)
- semi-automatic (proposition + confirm ops)
- manual (centre ops)

Police / securite nationale : **semi ou manuel** tant que cadre legal non signe.

---

## 27. Architecture AI

Conserver pipeline actuel ; enrichir sortie :

```json
{
  "incidentType": "...",
  "urgency": "critical|high|medium|low|info",
  "confidence": 0.0,
  "immediateDanger": true,
  "locationHints": [],
  "peopleAtRisk": [],
  "requiredServices": [],
  "summary": "...",
  "missingCriticalInformation": [],
  "recommendedActions": [],
  "aiDisclaimer": "..."
}
```

Regles :

- structured outputs + Zod
- versioning prompts
- logs retenus limites
- jamais de verdict juridique
- multilangue progressif (deja en place)

---

## 28. Architecture temps reel

Court terme : garder SSE ops, evenements riches (`incident_updated`, `unit_location`, `dispatch_timeout`).

Moyen terme : bus (Redis pub/sub) si multi-instance.

Carte ops : filtres permissionnes ; jamais exposition publique positions victimes.

---

## 29. Architecture USSD / SMS

Abstraction :

```
UssdGateway | SmsGateway | HotlineAdapter
        → normalize → Incident API
```

Menu USSD conceptuel (futur) :

1. SOS  
2. Signaler  
3. Violence / abus  
4. Enfant en danger  
5. Urgence medicale  
6. Autre  

Pas de logique metier separee dans l'operateur.

Env deja present : `NGEMBA_SMS_WEBHOOK_URL`, Africa's Talking stubs.

---

## 30. Architecture institutionnelle

Vues :

- locale (commune / partenaire)
- provinciale
- nationale strategique (agregats)

Controles : mandat legal, accreditation, audit, minimisation.  
NGEMBA n'est pas un outil de surveillance de masse.

---

## 31. Plan de migration (controle)

| Phase | Nom | Focus | Casse existant ? |
|-------|-----|-------|------------------|
| 0 | Audit + cible | Ce document | Non |
| 1 | Incident Core DB | Migrer sessions JSON → Postgres ; events ; API stable | Non si dual-write |
| 2 | AI Triage v2 | Enrichir schema ; isoler module AI | Non |
| 3 | RBAC/ABAC | Users org + accreditation ; tokens legacy bridge | Non |
| 4 | Organizations + Services | Annuaire DB + referral | Non |
| 5 | Operational Units | Entite + heartbeat | Non |
| 6 | Dispatch Engine | Scoring + assign + timeout | Feature flags |
| 7 | OPS Dashboard v2 | Unites + files + KPI | Non |
| 8 | Realtime tracking | Carte ops + timeline | Permissions |
| 9 | USSD/SMS abstraction | Gateways | Non |
| 10 | Prevention analytics | Heatmaps avancees | Agregats only |
| 11 | Institutional deploy | Protocoles ministere / PNC | Hors tech seul |

**Strategie anti-casse :** dual-write JSON→DB → read-DB → retire JSON.

---

## 32. Plan MVP (apres validation audit)

Objectif MVP infrastructure (pas tout le national) :

1. Postgres comme source de verite incidents  
2. `incident_events` timeline  
3. Module `response-engine` (regles sorties de `triage.ts`)  
4. Organizations DB + accreditation minimale  
5. Dispatch semi-auto vers partenaires (pas unites GPS encore)  
6. Statuts ACK + timeout escalade (niveau 2)  
7. Tests IDOR / isolation ONG A ≠ ONG B  

Reporter : USSD, unites ETA live, vue ministere, predictive ML.

---

## 33. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rewrite big-bang | Perte pilote live | Phases + dual-write |
| Dispatch police premature | Legal / confiance | Semi-manuel + accords |
| Fuite PII | Catastrophique | ABAC + audit + chiffrement |
| JSON store en prod | Perte donnees | Phase 1 prioritaire |
| Fausses alertes | Saturation | Scoring progressif, pas ban urgence |
| Complexite multi-agency | Ops confus | Modes et UX simples |
| Dependance OpenAI | Cout / offline | Hybrid local deja la |
| Surveillance drift | Ethique / politique | Agregats only publics |

---

## 34. Priorites

### P0 - immédiat (avant features vision)

1. Migrer alertes vers Postgres  
2. Audit log acces dossiers  
3. Bridge auth (tokens → membres org)  
4. Isoler AI vs Response Engine

### P1 - MVP coordination

5. Organizations + services directory  
6. Dispatch semi-auto + ACK + timeout  
7. Lifecycle etendu  
8. Tests securite isolation

### P2 - operationnel terrain

9. OperationalUnit + disponibilite  
10. Scoring ETA/capacite  
11. Carte ops permissionnee  
12. Metriques TTFA/TTA/TTR

### P3 - national

13. USSD/SMS  
14. Multi-agency mature  
15. Analytics prevention  
16. Cadre institutionnel

---

## 35. Alignement OpenAI (resume)

Modele utilise : `gpt-4o` (modele configure `gpt-5.5` indisponible).

- Verdict : vision ambitieuse, evolution progressive requise  
- Keep stack actuel  
- Remplacer store JSON par Postgres  
- Ajouter OperationalUnit, ETA, dispatch multi-agency, RBAC/ABAC  
- Ne pas casser : citoyen → signal → triage → orientation  

Fichier brut : [`_openai-audit-align.json`](./_openai-audit-align.json)

---

## 36. Ce qui s'aligne deja avec la vision

- Principe "le systeme comprend la personne"
- Alerte rapide + disclosure progressive
- IA triage ≠ verdict
- Humain dans la boucle
- GPS consentement / mode sans GPS
- Least privilege embryonnaire (files par role/zone)
- Survivor-centered (discret, anonymat, pas carte victimes)
- Orientation par proximite + fallback
- SLA / escalade
- Omnicanal prepare (SMS hooks)
- Prevention (observatoire, jeunesse, ecole)

## 37. Ce qui ne s'aligne pas

- Produit encore "orientation" plus que "dispatch"
- Pas d'unites / ETA / capacite
- Persistance non infrastructure
- Auth trop plate pour niveau national
- Lifecycle trop court pour intervention
- Categories / politiques peu configurables

---

## 38. Prochaine etape (apres validation humaine)

**Ne pas coder toute la vision.**

Valider ce rapport, puis demarrer **Phase 1 uniquement** :

> Incident Core : Postgres dual-write + `incident_events` + API inchangee pour citoyen/mobile.

Demander explicitement : `GO Phase 1` pour lancer l'implementation.

---

*Document v1.0 - Audit infrastructure NGEMBA - 5 sept. 2026*
