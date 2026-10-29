import { EMAIL_BRAND } from "@/lib/email/config";
import {
  NOV26_DATES_LABEL_EN,
  NOV26_DATES_LABEL_FR,
  NOV26_TIME_LABEL_EN,
  NOV26_TIME_LABEL_FR,
} from "@/lib/nov26/content";

/** Paid confirmation block: Google Meet + schedule + personal access notice. */
export function renderNov26MeetAccessEmailHtml(args: {
  meetUrl: string;
  recipientEmail: string;
  isFr: boolean;
}): string {
  const { meetUrl, recipientEmail, isFr } = args;
  const dates = isFr ? NOV26_DATES_LABEL_FR : NOV26_DATES_LABEL_EN;
  const time = isFr ? NOV26_TIME_LABEL_FR : NOV26_TIME_LABEL_EN;
  const heading = isFr ? "Vos sessions Google Meet" : "Your Google Meet sessions";
  const schedule = isFr
    ? `${dates} · chaque soirée · ${time}`
    : `${dates} · each evening · ${time}`;
  const join = isFr ? "Rejoindre Google Meet" : "Join Google Meet";
  const security = isFr
    ? `Accès nominatif · ce lien est envoyé uniquement à ${recipientEmail}. Connectez-vous sur mcbuleli.com avec ce même email pour retrouver le lien dans votre espace formation. Ne transférez pas ce message (identité et paiement vérifiés côté McBuleli).`
    : `Named access · this link was sent only to ${recipientEmail}. Sign in at mcbuleli.com with the same email to find the link in your training hub. Do not forward this email (identity and payment verified by McBuleli).`;

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;">
  <tr>
    <td style="padding:14px 18px 8px;background:${EMAIL_BRAND.mint};border-bottom:1px solid ${EMAIL_BRAND.border};">
      <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">${heading}</p>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.text};">${schedule}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 18px;text-align:center;">
      <a href="${meetUrl}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:${EMAIL_BRAND.white};font-size:14px;font-weight:800;text-decoration:none;padding:14px 28px;border-radius:12px;">${join}</a>
      <p style="margin:14px 0 0;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.muted};word-break:break-all;">${meetUrl}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:12px 18px 16px;border-top:1px solid ${EMAIL_BRAND.border};background:${EMAIL_BRAND.mint};">
      <p style="margin:0;font-size:11px;line-height:1.55;color:${EMAIL_BRAND.text};">${security}</p>
    </td>
  </tr>
</table>`;
}

export function nov26FormationSecurityBlurb(
  isFr: boolean,
  recipientEmail: string,
): string {
  return isFr
    ? `Sécurité McBuleli : inscription liée au compte ${recipientEmail}. Seul ce titulaire (connecté sur mcbuleli.com) accède à l'espace formation et au pass QR. Le lien Meet est personnel — ne le partagez pas publiquement.`
    : `McBuleli security: registration is tied to ${recipientEmail}. Only that account holder (signed in at mcbuleli.com) can open the training hub and QR pass. The Meet link is personal — do not share it publicly.`;
}
