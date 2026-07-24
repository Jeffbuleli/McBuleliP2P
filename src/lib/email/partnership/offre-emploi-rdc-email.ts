/**
 * Offre d'emploi RDC - suite réunion Henry / partenariat Hackathon.
 * Site : https://offredemploirdc.com · contact@offredemploirdc.com
 * FB : https://www.facebook.com/profile.php?id=100083340992571
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const OFFRE_EMPLOI_RDC_EMAIL = "contact@offredemploirdc.com";

export type OffreEmploiRdcEmailCopy = {
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
 * Win-win: Offre d'emploi RDC = RH / recrutement / diffusion emplois ;
 * McBuleli = hackathon builders IA à Silikin.
 * Primary role: Partenaire RH & Emploi (talents + diffusion).
 */
export function buildOffreEmploiRdcPartnershipEmail(): OffreEmploiRdcEmailCopy {
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const partnerUrl = "https://offredemploirdc.com/";
  const logo = logoUrl();
  const year = new Date().getFullYear();

  const subject =
    "Suite réunion - Partenariat Offre d'emploi RDC × McBuleli Hackathon";
  const preheader =
    "Programme 28–29 Août 2026 · Silikin Village (08h00–17h00) - ce que McBuleli attend, ce que Offre d'emploi RDC gagne.";

  const text = [
    "Bonjour Monsieur Henry,",
    "",
    "Merci pour la réunion et pour l'écoute autour de la vision McBuleli Hackathon. Comme convenu, voici le programme, ce que McBuleli attend d'Offre d'emploi RDC, et ce que vous y gagnez en devenant partenaire.",
    "",
    `Page publique : ${hackathonUrl}`,
    `Votre site : ${partnerUrl}`,
    "",
    "1) LE PROGRAMME",
    "McBuleli Hackathon - bootcamp Vibe Coding (Cursor, Claude, Codex) + compétition + Demo Day.",
    "Lieu : Silikin Village, Kinshasa",
    "Dates prévues :",
    "- 28 Août 2026 - Vendredi Bootcamp & Build (08h00-17h00)",
    "- 29 Août 2026 - Samedi Build & Demo Day (08h00-17h00)",
    "Statut lieu : en attente d'approbation finale de Silikin Village",
    "",
    "Public : builders, étudiants, jeunes talents tech & IA en RDC (~12 équipes attendues).",
    "",
    "2) CE QUE McBULELI ATTEND D'OFFRE D'EMPLOI RDC",
    "Rôle proposé : Partenaire RH & Emploi du Hackathon.",
    "",
    "- Diffusion : relayer le hackathon auprès de votre audience (site, Facebook, candidats)",
    "- Visibilité : logo partenaire RH sur mcbuleli.org/hackathon et supports événement",
    "- Option atelier court (20-30 min) : employabilité, CV / portfolio pour builders IA",
    "- Option talents : scouting / mise en relation avec les équipes prometteuses après Demo Day",
    "",
    "Ce n'est pas d'abord une demande de sponsoring cash.",
    "",
    "3) CE QUE GAGNE OFFRE D'EMPLOI RDC",
    "- Accès à un vivier de builders formés aux outils IA (Cursor, Claude, Codex)",
    "- Visibilité marque RH auprès de participants, mentors et partenaires à Silikin Village",
    "- Positionnement : acteur emploi & talents tech de l'écosystème innovation Kinshasa",
    "- Contenu (photos, témoignages, posts) réutilisable sur vos canaux",
    "- Pipeline : projets / profils intéressants pour vos clients recruteurs",
    "",
    "PROCHAINES ÉTAPES",
    "Merci de confirmer votre intérêt et de nous renvoyer :",
    "1) Contact référent (nom, email, téléphone / WhatsApp)",
    "2) Logo officiel (PNG ou SVG)",
    "3) Options retenues : diffusion seule / + atelier / + scouting talents",
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
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Partenaire RH &amp; Emploi</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">Bonjour Monsieur Henry,</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci pour la réunion et pour l'écoute autour de la vision
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Hackathon</strong>.
                Comme convenu, voici le <strong style="color:${EMAIL_BRAND.text};">programme</strong>,
                ce que McBuleli attend d'<strong style="color:${EMAIL_BRAND.text};">Offre d'emploi RDC</strong>,
                et ce que vous y gagnez en devenant partenaire
                (<a href="${esc(partnerUrl)}" style="color:${EMAIL_BRAND.primary};">offredemploirdc.com</a>).
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                1) Le programme
              </p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Bootcamp Vibe Coding (Cursor, Claude, Codex) + compétition + Demo Day ·
                ~12 équipes attendues · Silikin Village, Kinshasa.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>28 Août 2026</strong> - Vendredi Bootcamp &amp; Build (08h00–17h00)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>29 Août 2026</strong> - Samedi Build &amp; Demo Day (08h00–17h00)</td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.45;color:${EMAIL_BRAND.muted};">
                <strong style="color:${EMAIL_BRAND.text};">Statut lieu :</strong>
                en attente d'approbation finale de Silikin Village.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                2) Ce que McBuleli attend d'Offre d'emploi RDC
              </p>
              <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Rôle proposé :
                <strong style="color:${EMAIL_BRAND.text};">Partenaire RH &amp; Emploi</strong>
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Diffusion</strong> - relayer le hackathon auprès de votre audience (site, Facebook, candidats)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Logo</strong> - partenaire RH sur mcbuleli.org/hackathon et supports événement</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Option atelier</strong> - employabilité / CV / portfolio pour builders IA (20-30 min)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};"><strong>Option talents</strong> - scouting / mise en relation après Demo Day</td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Ce n'est <strong style="color:${EMAIL_BRAND.text};">pas</strong> d'abord une demande de sponsoring cash.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                3) Ce que gagne Offre d'emploi RDC
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Vivier de builders formés aux outils IA (Cursor, Claude, Codex)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Visibilité marque RH à Silikin Village (participants, mentors, partenaires)</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Positionnement emploi &amp; talents tech dans l'écosystème innovation Kinshasa</td></tr>
                <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr><td style="padding:8px 12px;background:${EMAIL_BRAND.mint};border-radius:10px;font-size:14px;line-height:1.45;color:${EMAIL_BRAND.text};">Contenu réutilisable + pipeline profils pour vos clients recruteurs</td></tr>
              </table>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Prochaines étapes
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Merci de confirmer votre intérêt et de nous renvoyer :
                <strong style="color:${EMAIL_BRAND.text};">contact référent</strong>,
                <strong style="color:${EMAIL_BRAND.text};">logo</strong> (PNG/SVG),
                et les options retenues (diffusion / atelier / scouting).
              </p>

              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Voir le programme du McBuleli Hackathon
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
