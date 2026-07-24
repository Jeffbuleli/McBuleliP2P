/**
 * Annonce à tous les partenaires : programme confirmé (2 Journées, Silikin Village)
 * + logos / noms des partenaires déjà visibles sur /hackathon.
 */
import { EMAIL_BRAND, logoUrl, partnershipPublicBaseUrl } from "@/lib/email/config";
import { CAMPUS_VISIBILITY_PROFILES } from "@/lib/email/partnership/campus-visibility-email";
import {
  BINANCE_PARTNER,
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_HOURS_LABEL_FR,
  HACKATHON_SCHEDULE_SUMMARY,
  HACKATHON_VENUE_SHORT,
  ILOKWE_PARTNER,
  PAWAPAY_PARTNER,
  hackathonFeaturedPartners,
} from "@/lib/hackathon/event-content";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONES_DISPLAY,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export type PartnersProgramUpdateEmailCopy = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export type FeaturedPartnerEmailLogo = {
  id: string;
  name: string;
  roleFr: string;
  href: string;
  /** Path under /public (no leading slash). */
  publicPath: string;
  cid: string;
  /** Tile background for email logo cell. */
  tileBg: string;
  contentType: "image/png" | "image/jpeg";
};

/** Partners shown on the hackathon landing (logos + names). */
export function featuredPartnersForEmail(): FeaturedPartnerEmailLogo[] {
  const featured = hackathonFeaturedPartners();
  const meta: Record<
    string,
    { roleFr: string; href: string; contentType: "image/png" | "image/jpeg" }
  > = {
    pawapay: {
      roleFr: PAWAPAY_PARTNER.roleFr,
      href: PAWAPAY_PARTNER.website,
      contentType: "image/png",
    },
    binance: {
      roleFr: BINANCE_PARTNER.roleFr,
      href: BINANCE_PARTNER.demo,
      contentType: "image/png",
    },
    ilokwe: {
      roleFr: ILOKWE_PARTNER.roleFr,
      href: ILOKWE_PARTNER.facebook,
      contentType: "image/png",
    },
  };

  return featured.map((p) => {
    const m = meta[p.id] ?? {
      roleFr: "Partenaire",
      href: p.href,
      contentType: "image/png" as const,
    };
    return {
      id: p.id,
      name: p.name,
      roleFr: m.roleFr,
      href: m.href,
      publicPath: p.logoUrl.replace(/^\//, ""),
      cid: `partner-${p.id}-logo`,
      tileBg:
        p.id === "binance"
          ? "#000000"
          : p.id === "ilokwe"
            ? "#0B3D2E"
            : "#F7F7F7",
      contentType: m.contentType,
    };
  });
}

/** Confirmed / engaged partner contacts for the program update blast. */
export const PARTNER_PROGRAM_UPDATE_RECIPIENTS: {
  org: string;
  email: string;
  cc?: string[];
}[] = [
  { org: "ILOKWE GROUP", email: ILOKWE_PARTNER.email },
  { org: "Kilelo", email: "support@kileloapp.com" },
  {
    org: "IA Académie RDC / CHK",
    email: "contact@ch-kin.com",
    cc: ["contact@ia-academie.cd"],
  },
  { org: "Hope Services", email: "hopeservicesrdc0@gmail.com" },
  { org: "Offre d'emploi RDC", email: "contact@offredemploirdc.com" },
  {
    org: "César Group",
    email: "cesargrouprdc@gmail.com",
    cc: ["contact@cesargroup-rdc.com"],
  },
  {
    org: "E-COM SAS",
    email: "jean.andre@e-comsas.com",
    cc: ["contact@e-comsas.com"],
  },
];

/**
 * Active hackathon ambassadors (promo kind=ambassador on VPS).
 * Excludes internal @mcbuleli.org addresses from the public blast.
 */
export const AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS: {
  org: string;
  email: string;
  code: string;
}[] = [
  {
    org: "Ambassadeur COORDHEC",
    email: "gdllks66@gmail.com",
    code: "COORDHEC",
  },
];

export function partnerProgramUpdateEmailSet(): Set<string> {
  const emails = new Set<string>();
  for (const r of PARTNER_PROGRAM_UPDATE_RECIPIENTS) {
    emails.add(r.email.trim().toLowerCase());
    for (const cc of r.cc ?? []) emails.add(cc.trim().toLowerCase());
  }
  return emails;
}

/** Ambassadors minus the 7 partner emails already blasted. */
export function ambassadorProgramUpdateRecipients(): {
  org: string;
  email: string;
  code: string;
}[] {
  const skip = partnerProgramUpdateEmailSet();
  return AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS.filter(
    (r) => !skip.has(r.email.trim().toLowerCase()),
  );
}

/** Campus / student-visibility contacts, excluding the 7 partner emails. */
export function campusProgramUpdateRecipients(): {
  id: string;
  org: string;
  email: string;
}[] {
  const skip = partnerProgramUpdateEmailSet();
  return CAMPUS_VISIBILITY_PROFILES.filter(
    (p) => !skip.has(p.contactEmail.trim().toLowerCase()),
  ).map((p) => ({
    id: p.id,
    org: p.orgName,
    email: p.contactEmail,
  }));
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPartnersProgramUpdateEmail(args?: {
  useInlineLogos?: boolean;
  /** partners (default) | ambassadors | campus */
  audience?: "partners" | "ambassadors" | "campus";
}): PartnersProgramUpdateEmailCopy {
  const useInline = args?.useInlineLogos !== false;
  const audience = args?.audience ?? "partners";
  const hackathonUrl = `${partnershipPublicBaseUrl()}/hackathon`;
  const brandLogo = logoUrl();
  const year = new Date().getFullYear();
  const partners = featuredPartnersForEmail();

  const subject = `Programme confirmé - McBuleli Hackathon · ${HACKATHON_DATES_LABEL_FR} · ${HACKATHON_VENUE_SHORT}`;
  const preheader = `2 Journées confirmées (${HACKATHON_HOURS_LABEL_FR}) au ${HACKATHON_VENUE_SHORT}. Voir le programme et nos partenaires.`;

  const greeting =
    audience === "ambassadors"
      ? "Bonjour chers Ambassadeurs,"
      : audience === "campus"
        ? "Bonjour chers Relais campus,"
        : "Bonjour chers Partenaires,";
  const thanks =
    audience === "ambassadors"
      ? "Merci pour votre engagement. Continuez à partager votre lien ambassadeur pour remplir les équipes - nous reviendrons bientôt pour la réunion (créneaux, ateliers, visibilité)."
      : audience === "campus"
        ? "Merci pour votre relais campus. Continuez à diffuser l'inscription auprès de vos étudiants - page programme ci-dessous."
        : "Merci pour votre engagement. Nous reviendrons très bientôt pour la réunion partenaires (créneaux, ateliers, visibilité).";
  const ambassadorCta =
    audience === "ambassadors" || audience === "campus"
      ? `\nEspace ambassadeur / relais : ${hackathonUrl.replace(/\/hackathon$/, "/hackathon/ambassadeur")}`
      : "";

  const scheduleText = HACKATHON_SCHEDULE_SUMMARY.map(
    (d) =>
      `- ${d.dateFr} - ${d.weekdayFr} ${d.focusFr} (${d.hoursFr.replace(/\s+/g, "")})`,
  ).join("\n");

  const partnersText = partners
    .map((p) => `- ${p.name} · ${p.roleFr}\n  ${p.href}`)
    .join("\n");

  const text = [
    greeting,
    "",
    "Nous vous confirmons officiellement le programme du McBuleli Hackathon.",
    "",
    "PROGRAMME CONFIRMÉ",
    `Lieu : ${HACKATHON_VENUE_SHORT}, Kinshasa`,
    `Horaires : ${HACKATHON_HOURS_LABEL_FR}`,
    scheduleText,
    "",
    "Format : Bootcamp Vibe Coding (Cursor, Claude, Codex) · Build intensif · Demo Day devant jury et partenaires.",
    "",
    "PARTENAIRES DÉJÀ SUR LA PAGE HACKATHON",
    partnersText,
    "",
    `Page programme : ${hackathonUrl}`,
    ambassadorCta.trim(),
    "",
    thanks,
    "",
    "Cordialement,",
    "McBuleli Team",
    "Mme Patty B.",
    SUPPORT_EMAIL,
    SUPPORT_PHONES_DISPLAY,
    `WhatsApp : ${SUPPORT_WA_PATH}`,
  ]
    .filter(Boolean)
    .join("\n");

  const scheduleRows = HACKATHON_SCHEDULE_SUMMARY.map(
    (d) => `
                <tr>
                  <td style="padding:12px 14px;background:${EMAIL_BRAND.mint};border-radius:12px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">${esc(d.weekdayFr)}</p>
                    <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:${EMAIL_BRAND.text};">${esc(d.dateFr)}</p>
                    <p style="margin:4px 0 0;font-size:14px;color:${EMAIL_BRAND.muted};">${esc(d.hoursFr)} · ${esc(d.focusFr)}</p>
                  </td>
                </tr>
                <tr><td style="height:10px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
  ).join("");

  const partnerCards = partners
    .map((p) => {
      const src = useInline
        ? `cid:${p.cid}`
        : `${partnershipPublicBaseUrl()}/${p.publicPath}`;
      return `
                <tr>
                  <td style="padding:12px;border:1px solid ${EMAIL_BRAND.border};border-radius:14px;background:${EMAIL_BRAND.white};">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="112" style="vertical-align:middle;padding-right:12px;">
                          <div style="width:112px;height:56px;border-radius:10px;background:${p.tileBg};text-align:center;line-height:56px;overflow:hidden;">
                            <img src="${esc(src)}" alt="${esc(p.name)}" width="108" height="52" style="display:inline-block;max-width:108px;max-height:52px;width:auto;height:auto;vertical-align:middle;border:0;" />
                          </div>
                        </td>
                        <td style="vertical-align:middle;">
                          <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_BRAND.primary};">${esc(p.roleFr)}</p>
                          <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:${EMAIL_BRAND.text};">${esc(p.name)}</p>
                          <p style="margin:4px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};"><a href="${esc(p.href)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${esc(p.href.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:10px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
    })
    .join("");

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
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:${EMAIL_BRAND.white};border-radius:16px;border:1px solid ${EMAIL_BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${esc(brandLogo)}" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:${EMAIL_BRAND.primary};letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">Hackathon IA · Programme confirmé</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};">${esc(greeting.replace(/,$/, ""))},</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Nous vous confirmons officiellement le <strong style="color:${EMAIL_BRAND.text};">programme</strong>
                du McBuleli Hackathon : <strong style="color:${EMAIL_BRAND.text};">2 Journées</strong>
                au <strong style="color:${EMAIL_BRAND.text};">${esc(HACKATHON_VENUE_SHORT)}</strong>
                (${esc(HACKATHON_DATES_LABEL_FR)}, ${esc(HACKATHON_HOURS_LABEL_FR)}).
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Programme confirmé
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
                ${scheduleRows}
              </table>

              <p style="margin:0 0 18px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Bootcamp Vibe Coding (Cursor, Claude, Codex) · Build intensif · Demo Day devant jury et partenaires.
              </p>

              <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:700;">
                Partenaires déjà sur la page Hackathon
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                Logos et noms déjà publiés sur <a href="${esc(hackathonUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">mcbuleli.org/hackathon</a>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
                ${partnerCards}
              </table>

              <p style="margin:0 0 22px;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
                ${esc(thanks)}
              </p>

              <p style="margin:0 0 22px;text-align:center;">
                <a href="${esc(hackathonUrl)}" style="display:inline-block;background:${EMAIL_BRAND.primary};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">
                  Voir le programme
                </a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};">
              <p style="margin:0;font-size:13px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                Cordialement,<br />
                <strong style="color:${EMAIL_BRAND.text};">McBuleli Team</strong> · Mme Patty B.<br />
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${SUPPORT_EMAIL}</a>
                · ${esc(SUPPORT_PHONES_DISPLAY)}
              </p>
              <p style="margin:10px 0 0;font-size:11px;color:${EMAIL_BRAND.muted};">© ${year} McBuleli</p>
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
