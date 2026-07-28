# Rapport d'audit de sécurité - kileloapp.com

- Émetteur : McBuleli (Ir Jeff Buleli - ceo@mcbuleli.org)
- Cible : https://kileloapp.com
- Période des tests : 27-28 juillet 2026
- Cadre : diagnostic autorisé (lettre d'autorisation jointe)
- Statut : aucune preuve d'exploitation ou de compromission observée

---

## 1. Résumé exécutif

L'évaluation de sécurité de la plateforme Kilelo a mis en évidence plusieurs points à traiter en priorité :

- configuration Supabase (RLS, stockage, secrets frontend)
- absence de Content-Security-Policy (CSP)
- exposition partielle d'éléments d'infrastructure
- contrôles d'authentification et de surface d'attaque à renforcer

Les tests ont été réalisés uniquement dans le périmètre autorisé, sans perturbation volontaire du service ni altération des données.

---

## 2. Périmètre observé

- Cible : kileloapp.com
- Description : plateforme de mise en relation clients / travailleurs à Kinshasa (RD Congo)
- CDN / proxy : Cloudflare (IP proxy 216.24.57.1)
- Frontend : Next.js (React) - génération statique
- Backend applicatif : Uvicorn (Python ASGI - probablement FastAPI)
- Backend data : Supabase (PostgreSQL + PostgREST)
- Stockage : Supabase Storage (bucket public observé)
- Projet Supabase identifié : qtrypzzcjebvfcihiynt

---

## 3. Constats par niveau de risque

### Critique

- URL / projet Supabase visible depuis les ressources publiques
- Clé anon Supabase très probablement présente dans le bundle JS client (comportement attendu pour Supabase, mais à contrôler)
- RLS non vérifié : si le Row Level Security est incomplet, une clé anon peut ouvrir un accès non autorisé
- Buckets de stockage potentiellement trop ouverts (chemins publics observés)
- Action immédiate : activer / vérifier le RLS sur toutes les tables, confirmer l'absence de clé service_role côté frontend, restreindre le stockage

### Élevé

- Content-Security-Policy manquant - risque XSS accru
- En-tête `x-render-origin-server: uvicorn` expose la stack serveur
- Recommandation : ajouter une CSP stricte et masquer les en-têtes techniques inutiles

### Moyen

- robots.txt introuvable (404) et sitemap non exploitable
- Pages de connexion / inscription présentes ; rate-limiting non visible
- Surface d'attaque API / routes internes à continuer de verrouiller
- Validation stricte des entrées utilisateur (profils, avis, messages) à renforcer

---

## 4. En-têtes HTTP observés

- Content-Security-Policy : manquant
- Strict-Transport-Security : présent (max-age=31536000)
- X-Frame-Options : DENY
- X-Content-Type-Options : nosniff
- Referrer-Policy : strict-origin-when-cross-origin
- Permissions-Policy : partiellement configuré
- Server : cloudflare (masqué - bon point)

---

## 5. Phases de test réalisées

- Phase 1 - Reconnaissance frontend / identification Supabase
- Phase 2 - Évaluation API REST / permissions / stockage
- Phase 3 - Évaluation XSS (validation, encodage, CSP)
- Phase 4 - Énumération des endpoints applicatifs
- Phase 5 - Évaluation des mécanismes d'authentification

Détail technique complet : fichier joint `McBuleli_Rapport_Pentest_Kileloapp-2026-07-28.docx` (et .odt).

---

## 6. Recommandations prioritaires

### Critique - à traiter en premier

- Activer le RLS sur toutes les tables Supabase
- Vérifier qu'aucune clé service_role n'est dans le code frontend
- Restreindre l'accès aux buckets de stockage Supabase

### Élevé

- Ajouter une Content-Security-Policy stricte
- Masquer l'en-tête x-render-origin-server

### Moyen

- Ajouter robots.txt et sitemap.xml cohérents
- Implémenter le rate-limiting sur le login
- Renforcer la validation des entrées utilisateur (profils, avis, messages)

---

## 7. Impact potentiel (si RLS / stockage insuffisants)

- Divulgation de données personnelles (profils, e-mails, téléphones, localisation)
- Exposition de contenus privés (messages, avis, informations professionnelles)
- Usurpation d'identité / hameçonnage ciblé
- Compromission de sessions si jetons mal protégés
- Altération ou suppression de données
- Impact réputationnel, réglementaire et financier

---

## 8. Conclusion

Priorité absolue : valider le RLS, l'absence de secrets privilégiés et la restriction du stockage. Ensuite : CSP, durcissement des en-têtes, rate-limiting et validation des entrées.

Ce document et les pièces jointes sont destinés exclusivement à l'équipe Kilelo et à ses représentants autorisés.

Fait à Kinshasa, le 28 juillet 2026

Ir Jeff Buleli  
ceo@mcbuleli.org  
+243 997 366 736 - +243 860 218 521  
https://mcbuleli.org
