/**
 * MontanaPay - follow-up partenariat produit (escrow / FinTech hackathon).
 * Contact : montanadelly7@gmail.com · https://www.montana-pay.com/
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const MONTANAPAY_EMAIL = "montanadelly7@gmail.com";

export type MontanaPayEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Previous WA reply listed every option → unclear ask.
 * New pitch: ONE primary role (tech partner escrow/FinTech) + 2 light options.
 */
export function buildMontanaPayPartnershipEmail(): MontanaPayEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const montanaUrl = "https://www.montana-pay.com/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Partenariat MontanaPay × McBuleli Hackathon - partenaire escrow & FinTech";
  const preheader =
    "Un rôle clair : partenaire technique escrow pour les projets marketplace - bénéfice builders et MontanaPay.";

  const text = [
    "Bonjour l'équipe MontanaPay,",
    "",
    "Merci pour votre message et pour la question précise sur le rôle attendu. Nous avons clarifié notre proposition autour de ce que MontanaPay fait le mieux : wallet sécurisé, escrow anti-arnaque, e-commerce et retrait Mobile Money (Orange, Airtel, M-Pesa...).",
    "",
    `Programme : ${hackathonUrl}`,
    `Votre produit : ${montanaUrl}`,
    "",
    "RÔLE PRINCIPAL QUE NOUS VOUS PROPOSONS",
    "Partenaire technique FinTech / Escrow du McBuleli Hackathon (Silikin Village).",
    "",
    "Concrètement :",
    "1) Session courte (30-45 min) pendant le bootcamp : « Escrow & confiance dans le e-commerce en RDC » - cas MontanaPay.",
    "2) Mentorat ciblé des équipes qui construisent marketplace, livraison, P2P ou wallet (1-2 créneaux).",
    "3) Si possible : sandbox / crédits de test / maquette d'intégration pour que les prototypes appellent un flux escrow réaliste (même simplifié).",
    "",
    "OPTION LÉGÈRE (si vous le souhaitez)",
    "- 1 siège jury sur les projets FinTech / e-commerce (demi-journée pitch).",
    "- Logo partenaire sur la page hackathon et les supports événement.",
    "",
    "Ce n'est pas d'abord une demande de sponsoring cash. Nous voulons d'abord un partenariat produit utile aux participants et visible pour MontanaPay.",
    "",
    "CE QUE MONTANAPAY Y GAGNE",
    "- Des builders qui découvrent et intègrent la logique escrow MontanaPay dans de vrais prototypes",
    "- Positionnement : référence paiement sécurisé / anti-arnaque auprès de l'écosystème Silikin",
    "- Pipeline de talents et de projets marketplace alignés avec votre roadmap",
    "- Contenu (talk + démo) réutilisable sur vos réseaux",
    "",
    "CE QUE GAGNENT LES PARTICIPANTS",
    "- Un cas d'usage local concret (pas seulement de la théorie IA)",
    "- Des prototypes plus crédibles (escrow, retrait MoMo, parcours acheteur/vendeur)",
    "- Un feedback métier FinTech pendant le hackathon",
    "",
    "CE QUE GAGNE McBULELI",
    "- Un partenaire FinTech crédible sur le défi e-commerce / inclusion",
    "- Une meilleure qualité des projets marketplace",
    "",
    "Prochaine étape : un appel de 20 minutes pour valider ce rôle (talk + mentorat ± sandbox) et un créneau Silikin.",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    hackathonUrl,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${esc(logo)}" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenaire Escrow / FinTech</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour l'équipe MontanaPay,</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci pour votre question claire sur le rôle attendu. Nous proposons un partenariat
                aligné sur votre force produit :
                <strong style="color:${EMAIL_BRAND.text};">wallet sécurisé, escrow anti-arnaque, e-commerce et retrait Mobile Money</strong>
                (<a href="${esc(montanaUrl)}" style="color:${EMAIL_BRAND.primary};">montana-pay.com</a>).
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Rôle principal (proposition claire)
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Partenaire technique FinTech / Escrow</strong> du McBuleli Hackathon au Silikin Village
                - pas une liste ouverte d'options, un engagement ciblé :
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>1. Talk 30-45 min</strong> - « Escrow &amp; confiance e-commerce en RDC » (cas MontanaPay)
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>2. Mentorat ciblé</strong> - équipes marketplace / P2P / wallet / livraison
                </td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">
                  <strong>3. Sandbox / démo intégrable</strong> - si disponible, pour des prototypes réalistes
                </td></tr>
              </table>

              <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Options légères (au choix) : 1 siège jury FinTech · logo partenaire sur
                <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};">mcbuleli.org/hackathon</a>.
                Ce n'est <strong>pas</strong> d'abord une demande de sponsoring cash.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Pourquoi c'est gagnant pour MontanaPay
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Builders qui intègrent la logique escrow dans de vrais prototypes ·
                positionnement « paiement anti-arnaque » à Silikin ·
                pipeline projets marketplace · contenu talk/démo pour vos réseaux.
              </p>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Prochaine étape :</strong>
                un appel de 20 minutes pour valider ce rôle et un créneau.
              </p>
              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Voir le Hackathon
                </a>
              </p>
              <p style="margin:0 0 6px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Cordialement,</p>
              <p style="margin:0;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a><br />
                ${esc(SUPPORT_PHONES_DISPLAY)}<br />
                WhatsApp :
                <a href="${esc(SUPPORT_WA_PATH)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">écrire sur WhatsApp</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};text-align:center;">
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                © ${year} McBuleli · RCCM : CD/KNG/RCCM/26-A-00382<br />
                <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">mcbuleli.org/hackathon</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, preheader, html, text };
}
