# NGEMBA - Securite cyber (Phase 0-1)

> App a haute sensibilite - mesures en place et roadmap.

---

## Mesures implementees

| Mesure | Detail |
|--------|--------|
| Auth ops | Token par role, cookie httpOnly + secure, comparaison timing-safe |
| Rate limit | POST `/api/alerts` : 12/min/IP · login ops : 8/min/IP |
| Headers | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| nginx | TLS, headers securite, geolocation=(self) |
| Donnees | Minimisation - pas de compte citoyen obligatoire, UUID session |
| IA | Triage local possible (0 API) - pas de fuite OpenAI si mode local |
| Ops API | Liste/patch/stream proteges - pas d'enum publique |
| Blocage | Chemins `/wp-admin`, `/.env`, `/api/admin` → 404 |

---

## Risques residuels

| Risque | Mitigation prevue |
|--------|-------------------|
| DDoS / spam alertes | Rate limit + Cloudflare (deja actif sur domaine) |
| Brute force ops token | Rate limit login + token long (32+ chars) |
| Fuite sessions JSON | Volume Docker isole, pas expose hors VPS |
| XSS | CSP + React escape + pas de HTML user dans ops |
| Attractivite cible | Monitoring Cyber Alert VPS, logs nginx |

---

## Actions recommandees (court terme)

1. **Cloudflare WAF** regles sur `ngemba.cyberalert-rdc.org`
2. **Fail2ban** nginx sur 401/429 ops login
3. **Backup chiffre** volume `ngemba_data`
4. **Rotation tokens** ops trimestrielle
5. **Audit externe** avant scale national

---

## Conformite

- Note juridique : [04-NOTE-JURIDIQUE-BROUILLON.md](./04-NOTE-JURIDIQUE-BROUILLON.md)
- Acces ops journalise (actor hash) - audit complet Phase 2
- Pas de carte victimes - agrégats only (plan Phase 5)

---

*Document v1.0*
