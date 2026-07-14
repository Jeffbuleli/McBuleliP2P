# Travail en équipe — local → GitHub → prod VPS

## Règle d’or

**GitHub `main` est la seule source de vérité.**  
Interdit : `rsync` / copier des fichiers du laptop vers le VPS.  
La prod ne fait que : `git pull` + `docker compose build`.

```
laptop (npm run dev → http://localhost:3000)
   → git push branche / PR
   → merge main sur GitHub
   → deploy VPS (Actions ou ops/vps/deploy.sh)
```

## Dev local (équipe)

1. Cloner : `git clone https://github.com/Jeffbuleli/McBuleliP2P.git`
2. Copier `.env.example` → `.env` (DB locale, `NEXT_PUBLIC_APP_URL=http://localhost:3000`)
3. `npm install` puis `npm run dev`
4. Ouvrir **http://localhost:3000/** — preview avant prod

Chacun travaille sur une branche `feat/…` ou `fix/…`, ouvre une PR, l’équipe valide sur localhost / la PR.

## Prod (VPS)

Sur le serveur (`/opt/mcbuleli`) :

```bash
bash ops/vps/deploy.sh
```

Ou : push sur `main` → workflow **Deploy VPS** (secrets GHA `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`).

## Première activation GHA

1. Sur GitHub : Settings → Secrets and variables → Actions  
   - `VPS_HOST` = `162.35.181.98`  
   - `VPS_USER` = `root`  
   - `VPS_SSH_KEY` = clé privée SSH déployée  
2. Un push sur `main` (ou *Run workflow*) lance le déploiement.

## Checklist avant merge

- [ ] Ça tourne sur http://localhost:3000
- [ ] Pas de secrets dans le commit (`.env` ignoré)
- [ ] PR revue / OK rapide
- [ ] Deploy = GitHub uniquement
