import { renderMcBuleliEmail } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";

export type HackathonCashbackPayoutEmailArgs = {
  to: string;
  partnerName: string;
  orgName: string;
  promoCode: string;
  /** Gross cashback withdrawn from claimable balance */
  grossUsd: number;
  feeUsd: number;
  netUsd: number;
  phoneNumber: string;
  providerLabel?: string | null;
  payoutReference?: string | null;
  outcome: "processing" | "completed" | "failed";
  failureMessage?: string | null;
  locale?: "fr" | "en";
};

function money(n: number): string {
  return n.toFixed(2);
}

/** Success / failure / launched emails for ambassador & partner MoMo cashback withdrawals. */
export async function sendHackathonCashbackPayoutEmail(
  args: HackathonCashbackPayoutEmailArgs,
): Promise<boolean> {
  const isFr = args.locale !== "en";
  const feePct = Math.round(FIAT_FEE_RATE * 100);
  const name = args.partnerName.trim() || args.orgName;
  const rail =
    args.providerLabel?.trim() ||
    (isFr ? "Mobile Money" : "Mobile Money");

  const subject =
    args.outcome === "completed"
      ? isFr
        ? `Cashback versé - ${money(args.netUsd)} USD reçus`
        : `Cashback paid - ${money(args.netUsd)} USD received`
      : args.outcome === "failed"
        ? isFr
          ? `Cashback non versé - retrait échoué`
          : `Cashback not paid - withdrawal failed`
        : isFr
          ? `Retrait cashback lancé - ${money(args.netUsd)} USD nets`
          : `Cashback withdrawal started - ${money(args.netUsd)} USD net`;

  const body =
    args.outcome === "completed"
      ? isFr
        ? `Bonjour ${name}, votre retrait cashback McBuleli Hackathon (code ${args.promoCode}) est confirmé. ${money(args.netUsd)} USD ont été envoyés vers ${rail} (${args.phoneNumber}). Frais plateforme ${feePct}% : ${money(args.feeUsd)} USD (brut ${money(args.grossUsd)} USD).`
        : `Hi ${name}, your McBuleli Hackathon cashback withdrawal (code ${args.promoCode}) is confirmed. ${money(args.netUsd)} USD was sent to ${rail} (${args.phoneNumber}). Platform fee ${feePct}%: ${money(args.feeUsd)} USD (gross ${money(args.grossUsd)} USD).`
      : args.outcome === "failed"
        ? isFr
          ? `Bonjour ${name}, le retrait cashback pour ${args.orgName} (code ${args.promoCode}) a échoué. Le montant brut ${money(args.grossUsd)} USD est à nouveau disponible sur votre dashboard. ${args.failureMessage ? `Détail : ${args.failureMessage}` : "Réessayez ou contactez hi@mcbuleli.org."}`
          : `Hi ${name}, the cashback withdrawal for ${args.orgName} (code ${args.promoCode}) failed. Gross ${money(args.grossUsd)} USD is available again on your dashboard. ${args.failureMessage ? `Detail: ${args.failureMessage}` : "Retry or contact hi@mcbuleli.org."}`
        : isFr
          ? `Bonjour ${name}, votre demande de retrait cashback est en cours. Brut ${money(args.grossUsd)} USD − frais ${feePct}% (${money(args.feeUsd)} USD) = ${money(args.netUsd)} USD nets vers ${rail} (${args.phoneNumber}). Vous recevrez un email de confirmation dès que Mobile Money répond.`
          : `Hi ${name}, your cashback withdrawal is processing. Gross ${money(args.grossUsd)} USD − ${feePct}% fee (${money(args.feeUsd)} USD) = ${money(args.netUsd)} USD net to ${rail} (${args.phoneNumber}). You will get a confirmation email when Mobile Money responds.`;

  const { html, text } = renderMcBuleliEmail({
    locale: isFr ? "fr" : "en",
    illustration:
      args.outcome === "failed"
        ? "withdrawUsdt"
        : args.outcome === "completed"
          ? "depositUsdt"
          : "verify",
    actionUrl: "https://mcbuleli.org/hackathon",
    copy: {
      subject,
      preheader:
        args.outcome === "completed"
          ? isFr
            ? `Versement ${money(args.netUsd)} USD confirmé`
            : `${money(args.netUsd)} USD payout confirmed`
          : args.outcome === "failed"
            ? isFr
              ? "Retrait cashback échoué - solde libéré"
              : "Cashback withdrawal failed - balance released"
            : isFr
              ? "Retrait Mobile Money en cours"
              : "Mobile Money withdrawal in progress",
      title:
        args.outcome === "completed"
          ? isFr
            ? "Cashback versé"
            : "Cashback paid"
          : args.outcome === "failed"
            ? isFr
              ? "Retrait échoué"
              : "Withdrawal failed"
            : isFr
              ? "Retrait lancé"
              : "Withdrawal started",
      body,
      cta: isFr ? "Voir le Hackathon" : "View Hackathon",
      footerHelp: isFr ? "Besoin d'aide ?" : "Need help?",
      footerContact: isFr ? "Contactez-nous" : "Contact us",
    },
    detailRows: [
      { label: isFr ? "Organisation" : "Organization", value: args.orgName },
      { label: isFr ? "Code promo" : "Promo code", value: args.promoCode },
      {
        label: isFr ? "Montant brut" : "Gross amount",
        value: `${money(args.grossUsd)} USD`,
      },
      {
        label: isFr ? `Frais (${feePct}%)` : `Fee (${feePct}%)`,
        value: `${money(args.feeUsd)} USD`,
      },
      {
        label: isFr ? "Net Mobile Money" : "Net Mobile Money",
        value: `${money(args.netUsd)} USD`,
      },
      { label: isFr ? "Téléphone" : "Phone", value: args.phoneNumber },
      { label: isFr ? "Réseau" : "Network", value: rail },
      ...(args.payoutReference
        ? [
            {
              label: isFr ? "Réf. retrait" : "Payout ref",
              value: args.payoutReference,
            },
          ]
        : []),
      {
        label: isFr ? "Statut" : "Status",
        value:
          args.outcome === "completed"
            ? isFr
              ? "Versé"
              : "Paid"
            : args.outcome === "failed"
              ? isFr
                ? "Échoué"
                : "Failed"
              : isFr
                ? "En cours"
                : "Processing",
      },
    ],
  });

  return sendEmail({ to: args.to, subject, html, text });
}

export function parseCashbackFeeNote(note: string | null | undefined): {
  feeUsd: number | null;
  netUsd: number | null;
  feeRate: number | null;
} {
  if (!note) return { feeUsd: null, netUsd: null, feeRate: null };
  const fee = note.match(/fee_usd=([0-9.]+)/i);
  const net = note.match(/net_usd=([0-9.]+)/i);
  const rate = note.match(/fee_rate=([0-9.]+)/i);
  return {
    feeUsd: fee ? Number(fee[1]) : null,
    netUsd: net ? Number(net[1]) : null,
    feeRate: rate ? Number(rate[1]) : null,
  };
}

export function buildCashbackFeeNote(args: {
  feeUsd: number;
  netUsd: number;
  feeRate: number;
  extra?: string | null;
}): string {
  const base = `fee_rate=${args.feeRate};fee_usd=${args.feeUsd.toFixed(2)};net_usd=${args.netUsd.toFixed(2)}`;
  const extra = args.extra?.trim();
  return extra ? `${base} | ${extra}` : base;
}
