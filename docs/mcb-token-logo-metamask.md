# McB — Logo token & warning MetaMask « À risque »

> Contrat : [`0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147`](https://bscscan.com/token/0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147)  
> Logo source repo : `public/brand/logo-256.png` ou `logo-512.png`

---

## 1. Pourquoi MetaMask affiche « À risque »

C’est **normal** pour un jeton nouvellement déployé :

- Pas encore listé CoinGecko / CoinMarketCap / Trust Wallet assets
- MetaMask ne reconnaît pas le contrat → badge risque / « token non vérifié »
- Le **logo** n’apparaît pas tant qu’une liste de tokens reconnue ne l’inclut pas

Ce n’est **pas** un bug du contrat. Ça ne bloque pas les transfers.

---

## 2. Logo sur BscScan (rapide, visible explorateur)

1. Compte [BscScan](https://bscscan.com) (email).
2. Token → [Update Token Info / Contact Us - Update Token Info](https://bscscan.com/contactus?id=6)  
   ou depuis la page token : **Update Token Info** (si disponible).
3. Fournir :
   - Contract : `0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147`
   - Name : McBuleli · Symbol : McB · Decimals : 18
   - Logo : PNG carré **32×32** ou **64×64** ou **256×256** (fond transparent OK)
   - Website : `https://mcbuleli.org`
   - Email projet
4. Utiliser une copie du logo McBuleli depuis le repo :
   - `https://mcbuleli.org/brand/logo-256.png`
   - ou télécharger `public/brand/logo-256.png` et uploader le fichier demandé

Délai review BscScan : souvent 1–5 jours.

---

## 3. Logo dans MetaMask / Trust Wallet (liste assets)

MetaMask mobile / beaucoup de wallets tirent le logo depuis **Trust Wallet Assets** :

1. Fork [trustwallet/assets](https://github.com/trustwallet/assets)
2. Ajouter dossier :
   `blockchains/smartchain/assets/0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147/`
   (adresse **checksum** EIP-55)
3. Fichiers :
   - `info.json` (name, symbol, decimals, website, explorer)
   - `logo.png` (256×256 recommandé)
4. Ouvrir une Pull Request

Exemple `info.json` :

```json
{
  "name": "McBuleli",
  "website": "https://mcbuleli.org",
  "description": "McBuleli utility token (BEP-20) on BNB Smart Chain.",
  "explorer": "https://bscscan.com/token/0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147",
  "type": "BEP20",
  "symbol": "McB",
  "decimals": 18,
  "status": "active",
  "id": "0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147"
}
```

Après merge + propagation (jours/semaines), MetaMask peut afficher le logo et réduire le warning.

---

## 4. Listing plus tard (A5+)

| Plateforme | Effet |
|------------|--------|
| PancakeSwap + liquidité | Visibilité swap |
| CoinGecko / CMC | MetaMask / apps reconnaissent mieux le token |
| DexScreener | Chart + logo si metadata OK |

---

## 5. En attendant — ajouter le token manuellement

MetaMask → Import tokens → Custom :

| Champ | Valeur |
|-------|--------|
| Address | `0x33D3F01a73c59fc0672c0efB3365adE8aCDE9147` |
| Symbol | McB |
| Decimals | 18 |

Le badge « À risque » peut rester jusqu’à listing — informer les users : *vérifier l’adresse contrat officielle sur mcbuleli.org / BscScan*.

---

## 6. Trésorerie (ops)

| Rôle | Adresse |
|------|---------|
| Trésorerie (`MCB_BUILDERS_TREASURY`) | `0x7Ada926CA3d30d2b102a09333EF34144C13EaAa9` |
| Owner deployer | `0x2d2bB686e52Bd85057AdbFd1CD0A2b5A1E6aC4CD` |

VPS `.env` :

```env
MCB_BUILDERS_TREASURY=0x7Ada926CA3d30d2b102a09333EF34144C13EaAa9
```

Puis `docker compose up -d web` ou `bash ops/vps/deploy.sh`.
