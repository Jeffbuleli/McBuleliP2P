# McBuleli Meet — `live.mcbuleli.org`

À exécuter **en root sur le VPS** (après Jitsi + HTTPS OK).

## Déploiement rapide (depuis GitHub)

```bash
cd /root
git clone --depth 1 https://github.com/Jeffbuleli/McBuleliP2P.git
cd McBuleliP2P
bash ops/jitsi/apply-nginx-live-gate.sh
bash ops/jitsi/apply-mcbuleli-brand.sh
```

Titre onglet attendu avec JWT depuis l’app : **« Lancement | McBuleli Meet »**. Logo : `mcbuleli-meet-logo.png`.

## 1. Sauvegarde

```bash
cp /etc/jitsi/meet/live.mcbuleli.org-config.js /root/live.mcbuleli.org-config.js.bak
```

## 2. Overrides McBuleli

Édite `/etc/jitsi/meet/live.mcbuleli.org-config.js` — **à la fin du fichier**, avant la dernière accolade du `var config = { ... }`, ajoute ou fusionne :

```javascript
// --- McBuleli Academy Live ---
config.defaultLanguage = 'fr';
config.defaultLocalDisplayName = 'McBuleli';
config.defaultRemoteDisplayName = 'Participant';

config.hideConferenceSubject = false;
config.prejoinPageEnabled = true;
config.enableWelcomePage = false;
config.enableUserRolesBasedOnToken = false;

config.disableDeepLinking = true;
config.disableThirdPartyRequests = false;

config.brandingRoomAlias = 'Salle McBuleli';

config.interfaceConfig = config.interfaceConfig || {};
config.interfaceConfig.APP_NAME = 'McBuleli Academy Live';
config.interfaceConfig.NATIVE_APP_NAME = 'McBuleli Academy Live';
config.interfaceConfig.PROVIDER_NAME = 'McBuleli';
config.interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL = 'https://mcbuleli.org/brand/logo-256.png';
config.interfaceConfig.SHOW_JITSI_WATERMARK = false;
config.interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = false;
config.interfaceConfig.SHOW_BRAND_WATERMARK = false;
config.interfaceConfig.SHOW_POWERED_BY = false;
config.interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT = false;
config.interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE = false;
config.interfaceConfig.MOBILE_APP_PROMO = false;
config.interfaceConfig.MOBILE_DOWNLOAD_LINK_ANDROID = '';
config.interfaceConfig.MOBILE_DOWNLOAD_LINK_IOS = '';
config.interfaceConfig.LANG = 'fr';
config.interfaceConfig.DEFAULT_BACKGROUND = '#f4f6f4';
```

> `enableWelcomePage: false` empêche la page « Démarrer une conférence » pour les visiteurs anonymes — **recommandé** avant d’ouvrir le produit payant.

**Accès McBuleli (compte + paiement hôte)** : `docs/academy-live-access.md` — **JWT VPS** : `ops/jitsi/jwt-setup.md`.

## 3. Titre page (nginx / HTML)

```bash
sed -i 's/Jitsi Meet/McBuleli Academy Live/g' /usr/share/jitsi-meet/title.html 2>/dev/null || true
```

## 4. Recharger

```bash
systemctl restart prosody jicofo jitsi-videobridge2
systemctl reload nginx
```

## 5. Test

- `https://live.mcbuleli.org` → plus de landing « créer une réunion » (ou redirection app)
- Ouvrir une salle test : `https://live.mcbuleli.org/mcbuleli-test`
- Titre onglet / interface : **McBuleli Academy Live**

## 6. Branding complet (favicon, logo rond, textes « McBuleli »)

- **Favicon** onglet navigateur → logo McBuleli (plus l’icône Jitsi)
- **Watermark** pré-join → logo **rond** (anneau vert), coin discret
- **Notifications** (« Merci d’avoir utilisé… ») → **McBuleli Academy Live**
- **Promo** Jitsi masquée (`SHOW_PROMOTIONAL_CLOSE_PAGE`)

**Script automatique** (repo sur le VPS ou copier `ops/jitsi/`) :

```bash
chmod +x ops/jitsi/apply-mcbuleli-brand.sh ops/jitsi/patch-jitsi-lang.py
bash ops/jitsi/apply-mcbuleli-brand.sh
```

(`apply-mcbuleli-watermark.sh` appelle le même script.)

**Option B — à la main** :

```bash
curl -fsSL https://mcbuleli.org/brand/logo-256.png -o /usr/share/jitsi-meet/images/mcbuleli-logo.png
cp /usr/share/jitsi-meet/images/watermark.svg /usr/share/jitsi-meet/images/watermark.svg.bak
# copier ops/jitsi/mcbuleli-watermark.svg → /usr/share/jitsi-meet/images/watermark.svg
cp ops/jitsi/mcbuleli-custom.css /usr/share/jitsi-meet/css/mcbuleli-custom.css
```

Puis à la fin de `live.mcbuleli.org-config.js` :

```javascript
config.defaultLogoUrl = 'https://mcbuleli.org/brand/logo-256.png';
config.interfaceConfig.DEFAULT_LOGO_URL = 'https://mcbuleli.org/brand/logo-256.png';
config.interfaceConfig.SHOW_JITSI_WATERMARK = false;
config.interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = false;
config.interfaceConfig.JITSI_WATERMARK_LINK = '';
config.customParticipantLabelCssUrl = '/css/mcbuleli-custom.css';
```

```bash
systemctl restart prosody jicofo jitsi-videobridge2 && systemctl reload nginx
```

Test : ouvrir une salle → **Ctrl+Shift+R** (vider le cache) → logo McBuleli discret en haut à gauche de la vidéo.

## 7. JWT (phase suivante — produit payant)

Pour forcer « seuls les liens McBuleli » :

- [Jitsi Handbook — token authentication](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-authentication)
- McBuleli émet le JWT après paiement plan + login

Sans JWT, les slugs de salle restent **secretables** mais pas inviolables.
