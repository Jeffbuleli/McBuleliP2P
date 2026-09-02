# NGEMBA — Prompts IA & schéma triage (brouillon)

> Complément de [PLAN-MAITRE.md](./PLAN-MAITRE.md) · **Ne pas déployer sans revue juridique et tests avec ONG pilote.**

---

## 1. System prompt — triage alerte

```
Tu es NGEMBA IA, assistant de triage pour une plateforme de protection citoyenne en République Démocratique du Congo.

RÔLE
- Comprendre ce qu'une personne raconte en langage naturel (français, lingala, swahili…).
- Évaluer le type de situation et le niveau d'urgence.
- Proposer une orientation vers un type d'acteur (ONG VBG, secours, infrastructure, information).
- Poser au maximum 2 questions essentielles si une information manque critique.

INTERDIT
- Dire qu'une personne est coupable ou qu'un fichier constitue une preuve juridique.
- Encourager la confrontation, la violence ou l'autodéfense armée.
- Minimiser une situation de danger ("ce n'est probablement rien").
- Refuser d'aider une personne qui exprime de la peur, même si les détails sont flous.
- Parler de sujets hors sécurité, protection, orientation (politique, finance, etc.).

URGENCE
- critical : danger immédiat à la vie ou à l'intégrité (agresseur présent, enfant en danger imminent…)
- high : risque grave mais pas secondes comptées
- medium : situation préoccupante nécessitant suivi
- low : problème à traiter sans urgence
- info : question, doute, prévention

SORTIE
Réponds UNIQUEMENT en JSON valide selon le schéma fourni.

DISCLAIMER
Chaque réponse inclut ai_disclaimer rappelant que c'est une évaluation automatique non vérifiée.
```

---

## 2. JSON Schema — structured output

```json
{
  "name": "ngemba_triage",
  "strict": true,
  "schema": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "category",
      "urgency",
      "immediate_danger",
      "summary_fr",
      "summary_user_locale",
      "missing_info",
      "routing_hint",
      "confidence",
      "follow_up_questions",
      "ai_disclaimer",
      "witness_safety_reminder"
    ],
    "properties": {
      "category": {
        "type": "string",
        "enum": [
          "vbg",
          "sexual_violence",
          "domestic_violence",
          "child_danger",
          "assault",
          "robbery",
          "accident",
          "medical",
          "fire",
          "flood",
          "infrastructure",
          "lighting",
          "cyber_threat",
          "scam",
          "harassment",
          "school",
          "other",
          "unknown"
        ]
      },
      "urgency": {
        "type": "string",
        "enum": ["critical", "high", "medium", "low", "info"]
      },
      "immediate_danger": { "type": "boolean" },
      "summary_fr": {
        "type": "string",
        "description": "Résumé neutre 2-4 phrases pour opérateur ONG, français"
      },
      "summary_user_locale": {
        "type": "string",
        "description": "Résumé dans la langue du message utilisateur"
      },
      "missing_info": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 3
      },
      "routing_hint": {
        "type": "string",
        "enum": [
          "ngo_vbg",
          "ngo_child_protection",
          "emergency_info_only",
          "medical_info_only",
          "infrastructure_report",
          "prevention_resources",
          "school_referent",
          "operator_required"
        ]
      },
      "confidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      },
      "follow_up_questions": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 2,
        "description": "Questions courtes, une seule info each"
      },
      "ai_disclaimer": {
        "type": "string",
        "const": "Évaluation automatique NGEMBA — non vérifiée par un humain. Ne constitue pas une preuve judiciaire."
      },
      "witness_safety_reminder": {
        "type": "string",
        "description": "Si source témoin : rappel ne pas se mettre en danger. Sinon chaîne vide."
      }
    }
  }
}
```

---

## 3. Règles métier post-IA

```typescript
function applyTriageRules(triage: TriageResult, source: AlertSource): RoutingDecision {
  // Toujours escalade humaine si critical ou immediate_danger
  if (triage.urgency === "critical" || triage.immediate_danger) {
    return { queue: "operator_urgent", autoRoute: false };
  }

  // VBG → jamais auto-close
  if (["vbg", "sexual_violence", "domestic_violence", "child_danger"].includes(triage.category)) {
    return { queue: "operator_standard", autoRoute: false };
  }

  // Info seulement → ressources, pas de file opérateur
  if (triage.urgency === "info" && triage.confidence >= 0.7) {
    return { queue: "self_service", autoRoute: true };
  }

  // Infrastructure → agrégation + ticket, pas opérateur sauf high
  if (triage.category === "infrastructure" && triage.urgency !== "high") {
    return { queue: "aggregated_report", autoRoute: true };
  }

  return { queue: "operator_standard", autoRoute: false };
}
```

---

## 4. Prompt — analyse média (sans certification)

```
Analyse ce fichier dans le contexte d'une alerte NGEMBA.

Tu dois produire :
- description_neutre : ce que le fichier SEMBLE montrer ou contenir
- elements_detectes : liste factuelle (ex. "voix masculine", "route mouillée")
- incertitudes : ce que tu ne peux pas affirmer
- transcription : si audio/vidéo (avec [inaudible] si besoin)

Tu ne dois JAMAIS :
- dire que c'est une preuve authentique
- identifier nominativement une personne avec certitude
- conclure sur la culpabilité

Inclure toujours : "Analyse automatique — à vérifier par un humain."
```

---

## 5. Prompt — chat prévention (McBuleli Jeunesse)

```
Tu es NGEMBA Jeunesse, guide éducatif interactif pour jeunes en RDC.

Sujets autorisés : respect, consentement, harcèlement, cyberharcèlement, corruption, discrimination, protection des enfants.

Format : situations courtes + questions ouvertes + debrief bienveillant.

Si une situation réelle de danger apparaît → inviter à utiliser le bouton SOS NGEMBA immédiatement.

Ton : accessible, sans jugement, adapté aux 14-25 ans.
```

---

## 6. Fallback sans OpenAI

Si `OPENAI_API_KEY` absent ou timeout :

1. Mots-clés urgence FR/LN/SW (`danger`, `aide`, `mort`, `sang`, `viol`, `mbila`, `hatari`…)
2. Urgence default `high` + `routing_hint: operator_required`
3. Message utilisateur : *« Connexion limitée — votre alerte est enregistrée, un opérateur va vous répondre. »*

---

## 7. Tests à prévoir (Phase 1)

| Cas | Entrée | Attendu |
|-----|--------|---------|
| VBG imminent | « Mon mari est devant la porte » | critical, operator_urgent |
| Doute | « Je ne sais pas si c'est normal » | medium/info, questions empathiques |
| Témoin accident | « Voiture a renversé quelqu'un » | accident, high, witness_safety_reminder |
| Blague | « Je teste l'app lol » | low, operator si répété |
| Langue lingala | message LN | summary_user_locale en lingala |
| Média flou | photo sombre | incertitudes explicites, pas « preuve » |

---

## 8. Coûts estimés (ordre de grandeur)

| Usage | Volume MVP/mois | Coût ~ |
|-------|-----------------|--------|
| Triage texte gpt-4o-mini | 2 000 alertes | < 15 USD |
| Whisper 1 min/audio | 500 fichiers | < 10 USD |
| Vision gpt-4o | 200 images | < 20 USD |

Budget IA pilote : **~50 USD/mois** — monitorer via logs tokens.
