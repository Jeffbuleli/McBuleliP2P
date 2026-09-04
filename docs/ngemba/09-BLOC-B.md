# NGEMBA - Bloc B (go produit + pilote)

---

## 1. Pilote designe

| | |
|--|--|
| **Organisation** | Justicia Great Lakes (JGL AFRICA) |
| **Referent** | Me **Arjoule Karinda** |
| **Email contact** | `akarhinda@gmail.com` *(apres validation McBuleli)* |
| **Statut** | Verification McBuleli via **info@ngemba-rdc.org** |
| **Email alertes (pilote)** | **info@ngemba-rdc.org** · BCC **ceo@mcbuleli.org** |

Apres validation : `NGEMBA_OPS_PILOT_VERIFIED=true` + email JGL + code ONG.

---

## 2. Checklist Bloc B

| # | Action | Statut |
|---|--------|--------|
| B1 | Verification flux McBuleli (hi@ + smoke prod) | ✅ script `bloc-b-smoke.sh` |
| B2 | Accord pilote signe | 📄 modele [12-ACCORD-PILOTE-JGL.md](./12-ACCORD-PILOTE-JGL.md) |
| B3 | Juridique publie (brouillon) | ✅ pages `/legal/*` · relecture avocat ⏳ |
| B4 | Formation ops JGL (30 min) | ✅ [13-FORMATION-OPS-JGL.md](./13-FORMATION-OPS-JGL.md) |
| B5 | Logo NGEMBA integre app + emails | ✅ |
| B6 | Roles dashboards (admin/ngo/security/partner) | ✅ v1 |
| B7 | Securite cyber renforcee | ✅ v1 |
| B9 | Pages Ressources + Prevenir + legal | ✅ |
| B8 | 1 alerte test prise en charge (ops) | ✅ smoke automatise · alerte reelle JGL ⏳ |
| B10 | Distribution APK pilote terrain | 📄 [23-PILOTE-APK-DISTRIBUTION.md](./23-PILOTE-APK-DISTRIBUTION.md) · envoi testeurs ⏳ |

**Bloc B technique : termine.** Reste humain : signature accord (B2), relecture avocat (B3), premiere alerte citoyenne reelle (B8).

---

## 3. Smoke test prod

```bash
ssh root@153.75.235.176
bash /opt/ngemba/ops/vps/bloc-b-smoke.sh
```

Verifie : alerte creee → email Resend → prise en charge admin → statut `oriented`.

---

## 4. Liens

- Roles : [10-ROLES-ACCREDITATION.md](./10-ROLES-ACCREDITATION.md)
- Securite : [11-SECURITE-CYBER.md](./11-SECURITE-CYBER.md)
- Protocole : [05-PROTOCOLE-OPERATEUR.md](./05-PROTOCOLE-OPERATEUR.md)

---

*Document v1.3 - Bloc B technique clos · signatures JGL en attente*
