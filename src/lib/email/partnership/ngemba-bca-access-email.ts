/**
 * NGEMBA × Bloc Citoyen Amani (BCA) — email info + accès ops Sud-Kivu.
 * From: hi@ · Signature: Mme Patty B.
 */
import { EMAIL_BRAND, logoUrl } from "@/lib/email/config";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export const NGEMBA_URL = "https://ngemba-rdc.org";
export const NGEMBA_OPS_LOGIN = "https://ngemba-rdc.org/ops/login";
export const NGEMBA_CHARTE = "https://ngemba-rdc.org/legal/charte-ong";
export const RCCM = "CD/KNG/RCCM/26-A-00382";
export const ID_NAT = "G2660507E";

export const BCA_CONTACT = {
  id: "bca",
  name: "Bloc Citoyen Amani (BCA)",
  greeting: "Bonjour Monsieur Assani, Bonjour l'équipe du Bloc Citoyen Amani",
  to: "blocamanirdc@gmail.com",
  phone: "+243 996 839 254",
  facebook: "https://www.facebook.com/profile.php?id=61593232664992",
};

export type BcaAccessEmailCopy = {
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

export function buildBcaAccessEmail(opsToken: string): BcaAccessEmailCopy {
  const year = new Date().getFullYear();
  const logo = logoUrl();
  const token = opsToken.trim();
  const subject =
    "NGEMBA × BCA — accès ops Sud-Kivu (Bukavu / Uvira) + guide 30 min";
  const preheader =
    "Votre file d’alertes Sud-Kivu est prête : login, code opérateur, cas enfants & paix.";

  const text = [
    `${BCA_CONTACT.greeting},`,
    "",
    "Nous sommes McBuleli. Nous opérons NGEMBA (https://ngemba-rdc.org) : alertes citoyennes (SOS, témoin, mode discret, Safe School) orientées vers des opérateurs humains ONG — sans remplacer police, SAMU ni justice.",
    "",
    "POURQUOI BCA",
    "Nous avons suivi votre travail à Bukavu : synergie pour la paix (Amani), Congo Peace Honors, enquête sur les enfants en situation de rue (~13 000 à Bukavu), et votre plaidoyer pour les réfugiés congolais (dont ceux partis d’Uvira). C’est exactement le type d’ancrage communautaire dont NGEMBA a besoin au Sud-Kivu.",
    "",
    "VOTRE PROFIL SUR LA PLATEFORME",
    "- Organisation : Bloc Citoyen Amani (BCA)",
    "- Zone : Sud-Kivu (Bukavu, Uvira, Baraka + communes Bukavu)",
    "- File ops : enfant en danger, école, VBG / harcèlement, orientation communauté",
    "- Unités : équipe Bukavu (protection enfant) + équipe Uvira (paix & orientation)",
    "",
    "ACCÈS DASHBOARD (à conserver confidentiel)",
    `1. Ouvrir : ${NGEMBA_OPS_LOGIN}`,
    `2. Code opérateur BCA : ${token}`,
    "3. Ne partagez ce code qu’avec les opérateurs désignés.",
    "",
    "CAS TYPES QUE VOUS VERREZ",
    "- Enfant en danger / rue → prise en charge, notes, orientation médiation / réinsertion",
    "- Safe School → écoute, référent, partenaire VBG si besoin",
    "- Signalement communauté → triage et orientation réseau BCA",
    "- Urgence vitale → numéros RDC d’abord, puis documentation NGEMBA",
    "",
    "FORMATION (30 min)",
    "Guide : https://ngemba-rdc.org (nous joignons le même contenu dans notre doc interne Formation ops BCA).",
    `Charte ONG : ${NGEMBA_CHARTE}`,
    "",
    "Prochaine étape : 20 minutes (appel / Meet / WhatsApp) pour une démo live avec un opérateur BCA.",
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
    NGEMBA_URL,
    `RCCM : ${RCCM} · ID Nat / NIF : ${ID_NAT}`,
    `Contact BCA (notre fiche) : ${BCA_CONTACT.phone} · ${BCA_CONTACT.to}`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
        <tr>
          <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <img src="${esc(logo)}" alt="McBuleli" width="40" height="40" style="display:block;border-radius:10px;" />
              </td>
              <td style="vertical-align:middle;">
                <div style="font-size:15px;font-weight:700;color:${EMAIL_BRAND.text};">McBuleli · NGEMBA</div>
                <div style="font-size:12px;color:${EMAIL_BRAND.muted};">Accès partenaire · Sud-Kivu</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 8px;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">${esc(BCA_CONTACT.greeting)},</p>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">
              Nous opérons <strong>NGEMBA</strong> — alertes citoyennes orientées vers des opérateurs humains ONG.
              Votre ancrage à Bukavu (paix <em>Amani</em>, enfants de rue, plaidoyer réfugiés Uvira, Congo Peace Honors)
              fait du <strong>Bloc Citoyen Amani</strong> un partenaire naturel pour la file <strong>Sud-Kivu</strong>.
            </p>
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL_BRAND.muted};">Profil ops</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:${EMAIL_BRAND.text};">
              Zone : Bukavu · Uvira · Baraka<br/>
              Priorités : enfant en danger · Safe School · orientation communautaire<br/>
              Équipes : Bukavu (protection enfant) + Uvira (paix &amp; orientation)
            </p>
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL_BRAND.muted};">Accès dashboard</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
              <tr><td style="padding:14px 16px;background:${EMAIL_BRAND.mint};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};">
                <div style="font-size:13px;color:${EMAIL_BRAND.muted};margin-bottom:6px;">URL</div>
                <a href="${esc(NGEMBA_OPS_LOGIN)}" style="font-size:15px;font-weight:600;color:${EMAIL_BRAND.primary};text-decoration:none;">${esc(NGEMBA_OPS_LOGIN)}</a>
                <div style="font-size:13px;color:${EMAIL_BRAND.muted};margin:12px 0 6px;">Code opérateur BCA (confidentiel)</div>
                <div style="font-size:16px;font-weight:700;letter-spacing:0.02em;color:${EMAIL_BRAND.text};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${esc(token)}</div>
              </td></tr>
            </table>
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${EMAIL_BRAND.muted};">Cas types Sud-Kivu</p>
            <ul style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
              <li>Enfant en danger / rue → prise en charge + orientation réinsertion</li>
              <li>Safe School → écoute + référent / partenaire VBG si besoin</li>
              <li>Communauté / harcèlement → triage réseau BCA</li>
              <li>Urgence vitale → numéros RDC d’abord</li>
            </ul>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
              Charte ONG : <a href="${esc(NGEMBA_CHARTE)}" style="color:${EMAIL_BRAND.primary};">${esc(NGEMBA_CHARTE)}</a><br/>
              Prochaine étape : <strong>20 min</strong> de démo live avec un opérateur BCA.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
              Cordialement,<br/>
              <strong>McBuleli Team</strong><br/>
              Mme Patty B.<br/>
              <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:${EMAIL_BRAND.primary};">${esc(SUPPORT_EMAIL)}</a><br/>
              ${esc(SUPPORT_PHONES_DISPLAY)} · WhatsApp ${esc(SUPPORT_WA_PATH)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 22px;border-top:1px solid ${EMAIL_BRAND.border};font-size:11px;line-height:1.45;color:${EMAIL_BRAND.muted};">
            RCCM ${esc(RCCM)} · ID Nat / NIF ${esc(ID_NAT)} · © ${year} McBuleli ·
            <a href="${esc(NGEMBA_URL)}" style="color:${EMAIL_BRAND.muted};">${esc(NGEMBA_URL)}</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, preheader, html, text };
}
