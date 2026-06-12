const ERROR_TEXT: Record<string, { en: string; fr: string }> = {
  invalid_amount: { en: "Invalid amount.", fr: "Montant invalide." },
  player_not_found: { en: "Player not found.", fr: "Joueur introuvable." },
  insufficient_mcb: { en: "Not enough McB.", fr: "McB insuffisant." },
  insufficient_energy: { en: "Not enough energy.", fr: "Énergie insuffisante." },
  insufficient_bp: { en: "Not enough BP.", fr: "BP insuffisants." },
  insufficient_xp: { en: "Not enough XP for this promotion.", fr: "XP insuffisant pour cette promotion." },
  insufficient_stock: { en: "Not enough mineral stock.", fr: "Stock minéral insuffisant." },
  site_not_found: { en: "Mining site not found.", fr: "Site minier introuvable." },
  invalid_mineral: { en: "Invalid mineral.", fr: "Minerai invalide." },
  invalid_payload: { en: "Invalid request.", fr: "Requête invalide." },
  invalid_quote: { en: "Could not estimate transport.", fr: "Impossible d'estimer le transport." },
  vehicle_locked: { en: "Vehicle not unlocked yet.", fr: "Véhicule pas encore débloqué." },
  over_capacity: { en: "Cargo exceeds vehicle capacity.", fr: "Cargaison trop lourde pour ce véhicule." },
  job_failed: { en: "Transport job failed to start.", fr: "Échec du lancement du transport." },
  item_not_found: { en: "Item not found in shop.", fr: "Article introuvable." },
  role_locked: { en: "Your career rank is too low.", fr: "Rang de carrière insuffisant." },
  already_owned: { en: "You already own this item.", fr: "Vous possédez déjà cet article." },
  max_role: { en: "Maximum career rank reached.", fr: "Rang maximum atteint." },
  refinery_locked: { en: "Refinery access not unlocked.", fr: "Accès raffinerie non débloqué." },
  min_quantity: { en: "Minimum 2 kg required to refine.", fr: "Minimum 2 kg pour raffiner." },
  already_premium: { en: "Stock is already premium grade.", fr: "Stock déjà de qualité premium." },
  invalid_boost: { en: "Invalid boost.", fr: "Boost invalide." },
  question_too_short: { en: "Question too short.", fr: "Question trop courte." },
  Unauthorized: { en: "Please sign in.", fr: "Veuillez vous connecter." },
  "siteId required": { en: "Site required.", fr: "Site requis." },
  "itemKey required": { en: "Item required.", fr: "Article requis." },
  "boostId required": { en: "Boost required.", fr: "Boost requis." },
  "Invalid payload": { en: "Invalid request.", fr: "Requête invalide." },
  "Invalid query": { en: "Invalid request.", fr: "Requête invalide." },
};

export function gameErrorText(code: string, fr: boolean): string {
  const entry = ERROR_TEXT[code];
  if (entry) return fr ? entry.fr : entry.en;
  if (code.includes("_")) {
    return fr ? "Une erreur est survenue." : "Something went wrong.";
  }
  return code;
}

export function formatGameFeedback(
  body: Record<string, unknown> | null | undefined,
  fr: boolean,
): string {
  if (!body) return fr ? "Erreur" : "Error";

  if (typeof body.messageFr === "string" && fr) return body.messageFr;
  if (typeof body.message === "string") {
    const msg = body.message;
    if (msg.startsWith("{") || msg.startsWith("[")) {
      try {
        const parsed = JSON.parse(msg) as Record<string, unknown>;
        return formatGameFeedback(parsed, fr);
      } catch {
        /* use raw */
      }
    }
    return gameErrorText(msg, fr);
  }
  if (typeof body.error === "string") return gameErrorText(body.error, fr);
  if (typeof body.messageFr === "string") return body.messageFr;

  return fr ? "Une erreur est survenue." : "Something went wrong.";
}

export function formatGameSuccess(
  body: Record<string, unknown>,
  fr: boolean,
): string | null {
  if (typeof body.messageFr === "string" && fr) return body.messageFr;
  if (typeof body.message === "string") return body.message;
  if (Array.isArray(body.applied) && body.applied.length > 0) {
    const label = typeof body.label === "string" ? body.label : "";
    const applied = (body.applied as string[]).join(", ");
    return label ? `${label} — ${applied}` : applied;
  }
  if (typeof body.roleLabelFr === "string" && fr) {
    return fr ? `Promu : ${body.roleLabelFr}` : `Promoted to ${String(body.roleLabel ?? body.roleLabelFr)}`;
  }
  if (typeof body.roleLabel === "string") {
    return fr ? `Promu : ${body.roleLabel}` : `Promoted to ${body.roleLabel}`;
  }
  return null;
}
