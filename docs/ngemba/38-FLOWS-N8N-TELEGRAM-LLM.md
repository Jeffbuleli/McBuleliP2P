# NGEMBA — n8n, Telegram, LLM (état nov. 2026)

## Telegram (prod)

- **Entrant :** `POST /api/channels/telegram/hook` (webhook Telegram direct, secret `NGEMBA_TELEGRAM_WEBHOOK_SECRET`).
- **Relais optionnel :** `POST /api/channels/telegram/inbound` (Bearer `NGEMBA_CHANNEL_INBOUND_SECRET`) pour n8n ou tests curl.
- **Flux :** message → triage → McBuleli / Ngemba IA (`runChannelAccompaniment`) → dossier JSON/ops · handoff → email ops + webhook n8n.
- **Vocal :** ElevenLabs transcription + réponse texte/voix.

n8n n’est plus sur le chemin critique de réponse ; il sert **alertes, timers, relances** via événements sortants.

## n8n (sortant)

`NGEMBA_OPS_WEBHOOK_URL` reçoit :

| `type` | Déclencheur |
|--------|-------------|
| `ngemba.session.ai_accompaniment_started` | Alerte créée sans handoff humain immédiat (app ou Telegram) |
| `ngemba.session.handoff_requested` | `notifyNewAlert` (équipe) |
| `ngemba.alert_escalated` | SLA dépassé |

Signature optionnelle : `X-Ngemba-Signature: sha256=…` si `NGEMBA_N8N_WEBHOOK_SECRET`.

Vérifier : `GET /api/health` → `channels.n8nWebhook`, `channels.telegram`.

## LLM aligné (OpenAI + NVIDIA NIM)

Module : `services/ngemba/src/lib/ai/llm-text.ts`

- **Triage** (`runTriage`) et **accompagnement** (`runChannelAccompaniment`) passent par `chatText`.
- `NGEMBA_LLM_PROVIDER=auto|openai|nvidia`
- NVIDIA : `NGEMBA_NVIDIA_API_KEY` + `NGEMBA_NVIDIA_MODEL` (défaut `meta/llama-3.1-8b-instruct`).
- Timeout : `NGEMBA_LLM_TIMEOUT_MS` (défaut 14 s).

## UI suivi (nov. 2026)

- **Citoyen** : badge de phase (`citizenTracking`), précision GPS ± m sur la session.
- **Ops** : bannière phase / canal / équipe notifiée sur le dossier.

## Checklist Silikin / démo

1. `curl -sS https://ngemba-rdc.org/api/health` — `llmProvider`, `telegram: true`
2. Bot Telegram : message test → réponse < 15 s
3. SOS web → session avec orientation + précision lieu si GPS
4. Ops : dossier + phase visible

*Document v1.0 — après renforcement code session du 26 nov. 2026*