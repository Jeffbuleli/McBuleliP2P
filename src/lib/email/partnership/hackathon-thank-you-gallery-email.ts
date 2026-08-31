/**
 * Merci post-hackathon · galerie HD · rappel livrables builders · annonce publication prototypes.
 */
import { EMAIL_BRAND, partnershipPublicBaseUrl } from "@/lib/email/config";
import { HACKATHON_GALLERY_PHOTOS } from "@/lib/hackathon/gallery-manifest";
import {
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

const PHOTO_COUNT = HACKATHON_GALLERY_PHOTOS.length;

export type HackathonThankYouGalleryArgs = {
  firstName?: string;
  /** Resend Broadcast merge tag */
  resendAudience?: boolean;
  /** hackathon = transactional list; broadcast = Resend segment */
  medium?: "hackathon" | "broadcast";
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildHackathonThankYouGalleryEmail(
  args: HackathonThankYouGalleryArgs = {},
): { subject: string; html: string; text: string } {
  const base = partnershipPublicBaseUrl();
  const medium = args.medium ?? "hackathon";
  const campaign = "thank_you_gallery";
  const galleryUrl = `${base}/hackathon/gallery?utm_source=email&utm_medium=${medium}&utm_campaign=${campaign}`;
  const espaceUrl = `${base}/hackathon/espace?utm_source=email&utm_medium=${medium}&utm_campaign=${campaign}`;
  const greeting = args.resendAudience
    ? "Bonjour {{{contact.first_name|ami}}},"
    : `Bonjour ${esc(args.firstName?.trim() || "Builder")},`;
  const subject = `Merci · galerie photos HD · McBuleli Hackathon Kinshasa`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.mint};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Merci pour le hackathon · ${PHOTO_COUNT} photos HD · rappel livrables · publication des prototypes bientôt.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.mint};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:0;line-height:0;">
              <a href="${galleryUrl}" style="text-decoration:none;">
                <img src="${base}/hackathon/kinshasa-skyline.jpg" width="560" alt="McBuleli Hackathon Kinshasa" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 26px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${base}/brand/logo-256.png" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon · Merci &amp; galerie</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 26px 8px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">${greeting}</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:800;color:${EMAIL_BRAND.text};">Merci d'avoir construit avec nous</h1>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Le McBuleli Hackathon Kinshasa (${esc(HACKATHON_DATES_LABEL_FR)} · ${esc(HACKATHON_VENUE_SHORT)}) restera un moment fort.
                Que vous ayez pitché, mentoré, partenariat ou simplement encouragé les équipes : merci.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 26px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.mint};border-radius:14px;border:1px solid ${EMAIL_BRAND.border};">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Galerie photos HD</p>
                    <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:${EMAIL_BRAND.text};">
                      <strong>${PHOTO_COUNT} photos</strong> du bootcamp et du hackathon sont en ligne.
                      Ouvrez la galerie, cliquez une photo, puis <strong>Télécharger HD</strong> pour la récupérer en pleine résolution.
                    </p>
                    <p style="margin:0;text-align:center;">
                      <a href="${galleryUrl}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">Voir la galerie · télécharger en HD</a>
                    </p>
                    <p style="margin:12px 0 0;font-size:12px;line-height:1.45;color:${EMAIL_BRAND.muted};text-align:center;">
                      <a href="${galleryUrl}" style="color:${EMAIL_BRAND.primary};text-decoration:underline;">mcbuleli.org/hackathon/gallery</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 26px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border-radius:12px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#92400e;">Builders · livrables</p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.text};">
                      Toutes les équipes n'ont pas encore finalisé leurs prototypes.
                      Si le vôtre est incomplet, ajoutez ou complétez vos liens (repo, démo, vidéo) dans
                      <strong>Mon espace</strong> dès que possible.
                    </p>
                    <p style="margin:12px 0 0;text-align:center;">
                      <a href="${espaceUrl}" style="display:inline-block;background:#ffffff;color:${EMAIL_BRAND.primary};text-decoration:none;font-size:14px;font-weight:700;padding:11px 20px;border-radius:10px;border:1px solid ${EMAIL_BRAND.border};">Mon espace · soumettre mon prototype</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 26px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.white};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">Communauté</p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                      Nous publierons les prototypes sur McBuleli <strong style="color:${EMAIL_BRAND.text};">dès que la dernière équipe aura soumis</strong>,
                      dans un délai bref après cette dernière soumission.
                      Merci de votre patience - l'objectif est de mettre en valeur chaque projet avec soin.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 26px 22px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                À très bientôt,<br />
                <strong style="color:${EMAIL_BRAND.text};">L'équipe McBuleli</strong><br />
                <span style="font-size:13px;">avec Mme Patty B.</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 26px 22px;border-top:1px solid ${EMAIL_BRAND.border};background:${EMAIL_BRAND.mint};">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
                · ${esc(SUPPORT_PHONES_DISPLAY)} ·
                <a href="${SUPPORT_WA_PATH}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">WhatsApp</a>
              </p>
              <p style="margin:0;font-size:11px;color:${EMAIL_BRAND.muted};">
                <a href="${base}/hackathon" style="color:${EMAIL_BRAND.primary};text-decoration:underline;">mcbuleli.org/hackathon</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${greeting}

Merci d'avoir construit avec nous

Le McBuleli Hackathon Kinshasa (${HACKATHON_DATES_LABEL_FR} · ${HACKATHON_VENUE_SHORT}) restera un moment fort.
Que vous ayez pitché, mentoré, partenariat ou encouragé les équipes : merci.

GALERIE PHOTOS HD (${PHOTO_COUNT} photos)
Ouvrez la galerie, cliquez une photo, puis « Télécharger HD » pour la récupérer en pleine résolution.
${galleryUrl}

BUILDERS · LIVRABLES
Toutes les équipes n'ont pas encore finalisé leurs prototypes.
Si le vôtre est incomplet, ajoutez ou complétez vos liens (repo, démo, vidéo) dans Mon espace dès que possible.
${espaceUrl}

COMMUNAUTÉ
Nous publierons les prototypes sur McBuleli dès que la dernière équipe aura soumis, dans un délai bref après cette dernière soumission.

À très bientôt,
L'équipe McBuleli · avec Mme Patty B.

${SUPPORT_EMAIL} · ${SUPPORT_PHONES_DISPLAY}
${base}/hackathon
`;

  return { subject, html, text };
}
