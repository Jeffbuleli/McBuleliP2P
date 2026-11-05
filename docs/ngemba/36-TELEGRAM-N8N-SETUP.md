# NGEMBA — Telegram + n8n (mise en service)

> Workflow n8n : **[NGEMBA Telegram Inbound](https://mcbuleli.app.n8n.cloud/workflow/b0DapGbD9FIcKc9h)** (`b0DapGbD9FIcKc9h`)  
> API : `POST https://ngemba-rdc.org/api/channels/telegram/inbound`  
> Spec : [35-MULTICANAL-N8N-TELEGRAM-EMAIL.md](./35-MULTICANAL-N8N-TELEGRAM-EMAIL.md)

---

## 1. Bot Telegram (@BotFather)

1. Ouvrir Telegram → **@BotFather** → `/newbot`
2. Nom affiché : `NGEMBA RDC` (exemple)
3. Username : `ngemba_rdc_bot` (doit finir par `bot`)
4. Copier le **token** (format `123456:ABC…`) — **ne pas committer**

---

## 2. Credential n8n Cloud

1. [mcbuleli.app.n8n.cloud](https://mcbuleli.app.n8n.cloud) → **Credentials** → **Add credential** → **Telegram API**
2. Coller le **Access Token** du bot
3. Ouvrir le workflow **NGEMBA Telegram Inbound**
4. Sur **Telegram Trigger** et **Telegram** (Send) → sélectionner la **même** credential
5. **Settings → Variables** (instance) :
   - `NGEMBA_CHANNEL_INBOUND_SECRET` = même valeur que sur le VPS (voir §3)

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

---

## 6. Limites v1

- Réponses = **McBuleli IA pilote** (triage + messages encadrés) — pas encore fil chat OpenAI multi-tours complet
- **VBG / critical** → handoff humain · pas de bot long
- Token bot **uniquement** dans n8n credentials · pas sur le VPS

---

*Document v1.0 — NGEMBA RDC*
