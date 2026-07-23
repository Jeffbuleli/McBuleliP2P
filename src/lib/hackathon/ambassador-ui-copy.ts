/** Compact FR/EN copy for ambassador + promo dashboard (ASCII dash only). */

export type HackathonUiLocale = "fr" | "en";

export function ambassadorPageCopy(locale: HackathonUiLocale) {
  const fr = locale === "fr";
  return {
    metaTitle: fr
      ? "Devenir ambassadeur - McBuleli Hackathon"
      : "Become an ambassador - McBuleli Hackathon",
    metaDesc: fr
      ? "Crée ton code promo McBuleli Hackathon, partage ton lien et gagne du cashback."
      : "Create your McBuleli Hackathon promo code, share your link, and earn cashback.",
    eyebrow: "McBuleli Hackathon",
    title: fr ? "Devenir ambassadeur" : "Become an ambassador",
    lede: fr
      ? "Crée ton code, partage ton lien d'inscription, suis les confirmations et retire ton cashback Mobile Money."
      : "Create your code, share your signup link, track confirmations, and withdraw cashback via Mobile Money.",
    ruleDiscount: (pct: number) =>
      fr
        ? `pour chaque personne qui s'inscrit avec ton code`
        : `for everyone who signs up with your code`,
    ruleCashback: fr
      ? "pour toi à chaque paiement confirmé"
      : "for you on each confirmed payment",
    ruleMin: fr
      ? "pour retirer via Mobile Money"
      : "to withdraw via Mobile Money",
    ruleAnti: fr
      ? "Pas de cashback sur ton propre paiement - anti-collusion actif"
      : "No cashback on your own payment - anti-collusion enabled",
    back: fr ? "Retour au hackathon" : "Back to hackathon",
    legal: "McBuleli - RCCM CD/KNG/RCCM/26-A-00382",
  };
}

export function ambassadorFormCopy(locale: HackathonUiLocale) {
  const fr = locale === "fr";
  return {
    loading: fr ? "Chargement…" : "Loading…",
    activeCode: fr ? "Code actif" : "Active code",
    alreadyActive: fr
      ? "Tu as déjà un code ambassadeur. Partage ton lien et suis les confirmations."
      : "You already have an ambassador code. Share your link and track confirmations.",
    shareLink: fr ? "Lien à partager" : "Share link",
    copyLink: fr ? "Copier le lien" : "Copy link",
    copied: fr ? "Copié" : "Copied",
    openDash: fr ? "Ouvrir mon dashboard" : "Open my dashboard",
    viewLink: fr ? "Voir mon lien" : "View my link",
    displayName: fr ? "Nom public" : "Public name",
    displayPh: "Ex. Jeff Buleli",
    codeLabel: fr ? "Ton code promo" : "Your promo code",
    codePh: "Ex. JEFF243",
    codeHint: fr
      ? "4 à 16 caractères - lettres et chiffres seulement."
      : "4 to 16 characters - letters and numbers only.",
    discountLine: (pct: number, price: number) =>
      fr
        ? `-${pct}% pour tes inscrits (${price} USD)`
        : `-${pct}% for your signups (${price} USD)`,
    cashbackLine: (usd: number) =>
      fr
        ? `+${usd} USD cashback par paiement confirmé`
        : `+${usd} USD cashback per confirmed payment`,
    account: fr ? "Compte" : "Account",
    submit: fr ? "Créer mon code" : "Create my code",
    creating: fr ? "Création…" : "Creating…",
    err: {
      invalid_code: fr
        ? "Code invalide (4-16 lettres/chiffres)."
        : "Invalid code (4-16 letters/numbers).",
      invalid_display_name: fr
        ? "Nom public trop court."
        : "Public name too short.",
      code_taken: fr
        ? "Ce code est déjà pris. Choisis-en un autre."
        : "This code is taken. Pick another.",
      no_edition: fr
        ? "Aucune édition hackathon active."
        : "No active hackathon edition.",
      auth_required: fr
        ? "Connecte-toi pour continuer."
        : "Sign in to continue.",
      fallback: fr
        ? "Impossible de créer le code."
        : "Could not create the code.",
      network: fr ? "Erreur réseau." : "Network error.",
    },
  };
}

export function promoDashCopy(locale: HackathonUiLocale) {
  const fr = locale === "fr";
  return {
    ambEyebrow: fr ? "Ambassadeur Hackathon" : "Hackathon ambassador",
    partnerEyebrow: fr ? "Partenaire Hackathon" : "Hackathon partner",
    shareStrip: fr ? "Lien à partager" : "Share link",
    copy: fr ? "Copier" : "Copy",
    copied: fr ? "Copié" : "Copied",
    updated: fr ? "Mise à jour" : "Updated",
    authTitle: fr ? "Vérification email" : "Email verification",
    authBody: fr
      ? "Pour voir les inscrits et retirer le cashback, validez l'accès avec le code envoyé à"
      : "To see signups and withdraw cashback, verify access with the code sent to",
    yourEmail: fr ? "votre email" : "your email",
    partnerEmail: fr ? "votre email partenaire" : "your partner email",
    sendCode: fr ? "Recevoir le code" : "Get the code",
    resendCode: fr ? "Renvoyer le code" : "Resend code",
    otpLabel: fr ? "Code à 6 chiffres" : "6-digit code",
    validate: fr ? "Valider" : "Verify",
    kpiSignups: fr ? "Inscrits" : "Signups",
    kpiConfirmed: fr ? "Confirmés" : "Confirmed",
    kpiPending: fr ? "En attente" : "Pending",
    kpiCashback: "Cashback",
    seatsTitle: fr ? "Places partenaires" : "Partner seats",
    unlocked: (n: number) =>
      fr ? (n > 1 ? "débloquées" : "débloquée") : "unlocked",
    cashbackTitle: fr ? "Cashback à retirer" : "Cashback to withdraw",
    cashbackHint: fr
      ? "Cumulé confirmé"
      : "Confirmed total",
    withdrawMm: fr ? "retrait Mobile Money" : "Mobile Money withdraw",
    askCashback: fr ? "Demander le cashback" : "Request cashback",
    withdrawTitle: fr ? "Retrait Mobile Money" : "Mobile Money withdraw",
    close: fr ? "Fermer" : "Close",
    amount: fr ? "Montant (USD)" : "Amount (USD)",
    available: (c: number, min: number) =>
      fr
        ? `Disponible : ${c} USD (min. ${min})`
        : `Available: ${c} USD (min. ${min})`,
    continue: fr ? "Continuer" : "Continue",
    signupsTitle: fr ? "Inscrits via votre code" : "Signups via your code",
    colName: fr ? "Nom" : "Name",
    colStatus: fr ? "Statut" : "Status",
    colTicket: "Ticket",
    colWa: "WhatsApp",
    colEmail: "Email",
    listAfterAuth: fr
      ? "Liste disponible après vérification email."
      : "List available after email verification.",
    emptyAmb: fr
      ? "Aucun inscrit pour le moment. Partage ton lien ambassadeur."
      : "No signups yet. Share your ambassador link.",
    emptyPartner: fr
      ? "Aucun inscrit pour le moment. Partagez votre lien."
      : "No signups yet. Share your link.",
    cashbackLocked: fr ? "Cashback cumulé" : "Cashback earned",
    verifyToClaim: fr
      ? "Vérifiez votre email pour demander le retrait."
      : "Verify your email to request a withdrawal.",
    write: fr ? "Écrire" : "Message",
    perPaid: fr ? "USD / payé" : "USD / paid",
  };
}
