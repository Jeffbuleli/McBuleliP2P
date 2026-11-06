# NGEMBA — Telegram

> **6 nov. 2026 :** le bot répond lui-même, texte et vocal, via `POST https://ngemba-rdc.org/api/channels/telegram/hook`. `setWebhook` pointe ici. Le token `Telegram_Bot_Token` et `NGEMBA_TELEGRAM_WEBHOOK_SECRET` sont dans `/opt/ngemba/ops/vps/.env`. n8n n'est plus sur le chemin de la réponse.

> Ancien chemin n8n : **[NGEMBA Telegram Inbound](https://mcbuleli.app.n8n.cloud/workflow/b0DapGbD9FIcKc9h)**  
> API relais (toujours là) : `POST https://ngemba-rdc.org/api/channels/telegram/inbound`

---

## 1. Bot Telegram (@BotFather)

1. Ouvrir Telegram → **@BotFather** → `/newbot`
2. Nom affiché : `NGEMBA RDC` (exemple)
3. Username : `ngemba_rdc_bot` (doit finir par `bot`)
4. Copier le **token** (format `123456:ABC…`) — **ne pas committer**

---

## 2. n8n Cloud (prod actuelle)

Workflow **publié** : [NGEMBA Telegram Inbound](https://mcbuleli.app.n8n.cloud/workflow/7eC4fHp2a5tM4OTs)

1. **Webhook** `POST https://mcbuleli.app.n8n.cloud/webhook/ngemba-telegram-inbound`
2. **HTTP** → NGEMBA `/api/channels/telegram/inbound` (Bearer = secret VPS)
3. **HTTP** → Telegram `sendMessage` (token bot dans l’URL du node)

Webhook Telegram (`setWebhook`) : `https://mcbuleli.app.n8n.cloud/webhook/ngemba-telegram-inbound`

Token : `.env` racine `Telegram_Bot_Token`, recopié sur le VPS NGEMBA. Le vocal entrant est transcrit (ElevenLabs), la réponse part en texte, et aussi en audio si le message reçu était un vocal.

---

## 2bis. Alternative : credential Telegram UI

1. Credentials → **Telegram API** → token @BotFather
2. Nodes **Telegram Trigger** + **Telegram** (workflows archivés)

---

## 3. Secret partagé VPS ↔ n8n

Sur le VPS `/opt/ngemba/ops/vps/.env` :

```bash
# openssl rand -hex 24
NGEMBA_CHANNEL_INBOUND_SECRET=<secret-32+-chars>
```

Même valeur dans **n8n Cloud → Settings → Variables** : `NGEMBA_CHANNEL_INBOUND_SECRET`.

Le node **HTTP Request** envoie :  
`Authorization: Bearer {{ $env.NGEMBA_CHANNEL_INBOUND_SECRET }}`

---

## 4. Activer le workflow

1. Vérifier les connexions : **Telegram Trigger** → **HTTP Request** → **Telegram** (Send)
2. **Publish** le workflow (Production)
3. Envoyer un message au bot depuis Telegram
4. Vérifier **Executions** dans n8n + dossier ops sur `ngemba-rdc.org/ops`

---

## 5. Test API (sans Telegram)

```bash
curl -sS -X POST 'https://ngemba-rdc.org/api/channels/telegram/inbound' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SECRET' \
  -d '{
    "idempotencyKey": "test:1",
    "telegramUserId": "999",
    "telegramChatId": "999",
    "text": "Bonjour, j ai besoin d orientation",
    "locale": "fr"
  }'
```

Réponse attendue : `sessionId`, `replies[]` avec texte McBuleli IA (pilote).

Message vocal : envoyer aussi `audioBase64` (ogg/webm) et `audioMime`. La réponse ajoute `transcript` et `voiceBase64` (mp3 ElevenLabs) pour un node Telegram `sendVoice`. `wantVoice: true` demande la voix même si le message était du texte.

Dans l'app, le micro du chat transcrit avec ElevenLabs et Ngemba répond à voix haute. Variable : `ELEVEN_LABS` (déjà dans le `.env` racine, recopiée sur le VPS).

---

## 6. Limites v1

- Réponses = **McBuleli IA pilote** (triage + messages encadrés) — pas encore fil chat OpenAI multi-tours complet
- **VBG / critical** → handoff humain · pas de bot long
- Token bot **uniquement** dans n8n credentials · pas sur le VPS

---

*Document v1.0 — NGEMBA RDC*
