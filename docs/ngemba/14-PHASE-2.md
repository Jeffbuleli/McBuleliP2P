# NGEMBA — Phase 2 (Médias & témoin)

> **Statut :** v1 déployée · fichiers locaux VPS · Whisper optionnel

---

## Livré

| Feature | Détail |
|---------|--------|
| Upload photo / audio / vidéo | `POST /api/alerts/[id]/media` · max 8 Mo · 5 fichiers/session |
| Stockage | Volume Docker `/app/data/media/{sessionId}/` |
| Transcription audio | OpenAI Whisper si `OPENAI_API_KEY` |
| Chat session | `POST/GET /api/alerts/[id]/messages` citoyen ↔ opérateur |
| Compte citoyen optionnel | Cookie `ngemba_citizen` · `/me` historique alertes |
| Parcours témoin | `/witness` (Phase 1) + médias/chat Phase 2 |
| Swahili UI | ✅ (Phase 1) |

---

## URLs

- Session citoyen : `/session/[id]` — médias + chat
- Mes alertes : `/me`
- Ops dossier : `/ops/[id]` — médias + réponse chat

---

## Env optionnel

```bash
OPENAI_API_KEY=...           # Whisper transcription audio
OPENAI_WHISPER_MODEL=whisper-1
```

Sans clé OpenAI : upload fonctionne, pas de transcription auto.

---

## Prochaines étapes Phase 2+

1. Chiffrement at-rest des médias (clé VPS)
2. R2/S3 quand scale (Postgres + object storage)
3. Notifications push opérateur sur nouveau message
4. i18n pages `/me` et legal (6 langues)

---

*Document v1.0*
