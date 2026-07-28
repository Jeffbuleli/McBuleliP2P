/**
 * Annonce du rôle confirmé / proposé de chaque partenaire + liens d'accès
 * selon l'accréditation (chat, jury, promo, live).
 */

export type PartnerAccessLink = {
  label: string;
  url: string;
  note?: string;
};

export type PartnerRoleAnnouncement = {
  id: string;
  orgName: string;
  shortName: string;
  to: string;
  cc?: string[];
  /** confirmed | in_progress */
  status: "confirmed" | "in_progress";
  /** Titre du rôle affiché dans l'email */
  roleTitle: string;
  /** Bullet contributions / droits selon accréditation */
  entitlements: string[];
  /** Liens d'accès (ordre = priorité CTA) */
  links: PartnerAccessLink[];
  greeting?: string;
  /** org slug for badge seed (matches hackathon_partner_orgs.slug) */
  orgSlug?: string;
  /** Seat 1 badge URL (owner-gated) - filled at send time when possible */
  badgePassUrl?: string | null;
  badgeCode?: string | null;
  /** false for orgs without door badges (e.g. SanJa) */
  hasBadges?: boolean;
};

const CHAT = "https://mcbuleli.org/hackathon/chat";
const HACKATHON = "https://mcbuleli.org/hackathon";
const JURY = "https://mcbuleli.org/hackathon/jury";
const LIVE = "https://mcbuleli.org/hackathon/live";
const AMBASSADEUR = "https://mcbuleli.org/hackathon/ambassadeur";

/** Roster pour l'annonce de rôle + espace d'accès. */
export const PARTNER_ROLE_ANNOUNCEMENTS: PartnerRoleAnnouncement[] = [
  {
    id: "ilokwe",
    orgSlug: "ilokwe",
    hasBadges: true,
    orgName: "ILOKWE GROUP",
    shortName: "ILOKWE",
    to: "ilokwegroup@gmail.com",
    status: "confirmed",
    roleTitle:
      "Partenaire Agriculture & AgriBusiness - Sponsor Or - Jury - Mentorat - Atelier",
    entitlements: [
      "Siège Jury sur les prototypes AgroTech (Demo Day)",
      "Mentorat des équipes sur le défi AgroTech & économie réelle",
      "Atelier : rentabilité agricole, exécution terrain & chaîne de valeur",
      "Naming du premier prix : Prix ILOKWE",
      "Visibilité Sponsor Or (landing, badges, supports)",
      "Code promo ILOKWE (−10%, cashback) · places partenaires selon seuils",
      "Accès à l'espace d'échange partenaires (coordination opérationnelle)",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Onglet Préparation : badges, 2e place collègue, to-do atelier/mentorat/jury",
      },
      {
        label: "Espace Jury",
        url: JURY,
        note: "Connectez-vous avec l'email de votre organisation (compte à lier par McBuleli si besoin)",
      },
      { label: "Live événement", url: LIVE },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "rdpi",
    orgSlug: "rdpi",
    hasBadges: true,
    orgName: "RDPI Think Tank",
    shortName: "RDPI",
    to: "info@rdpithinktank.org",
    cc: ["maristote@rdpithinktank.org"],
    status: "confirmed",
    greeting: "Bonjour Mr Aristote,",
    roleTitle: "Partenaire Policy & Impact - Atelier - Mentorat - Jury",
    entitlements: [
      "Atelier : innovation, politiques publiques & impact socio-économique en RDC",
      "Mentorat : régulation, adoption des innovations & durabilité (pas employabilité RH)",
      "Jury : pertinence socio-économique, durabilité & potentiel d'impact",
      "Diffusion via vos canaux institutionnels",
      "Accès à l'espace d'échange partenaires",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Coordination atelier / mentorat / jury",
      },
      {
        label: "Espace Jury",
        url: JURY,
        note: "Compte McBuleli avec votre email organisation (liaison par McBuleli si besoin)",
      },
      { label: "Live événement", url: LIVE },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "kimia",
    orgSlug: "kimia",
    hasBadges: true,
    orgName: "KIMIA Service",
    shortName: "KIMIA",
    to: "kimiaservice896@gmail.com",
    status: "confirmed",
    greeting: "Bonjour Mr Mike,",
    roleTitle: "Partenaire Services & Talents - Mentorat",
    entitlements: [
      "Mentorat : professionnalisation, employabilité & développement des services (pas policy/jury)",
      "Mise en relation talents ↔ opportunités / entreprises partenaires",
      "Diffusion auprès de votre réseau professionnel",
      "Logo officiel reçu + présence espace partenaires",
      "2 badges porte (vous + 1 collègue) - accès exclusif propriétaire",
      "Espace Préparation : to-do atelier/mentorat",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Onglet Préparation : badges + to-do + octroi 2e place",
      },
      { label: "Live événement", url: LIVE },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "montana-pay",
    orgSlug: "montana-pay",
    hasBadges: true,
    orgName: "MontanaPay",
    shortName: "MontanaPay",
    to: "montanadelly7@gmail.com",
    status: "confirmed",
    greeting: "Bonjour la Direction de MontanaPay,",
    roleTitle: "Partenaire FinTech / Escrow - Talk - Mentorat",
    entitlements: [
      "2 badges porte (titulaire + 1 collègue) - ouverture exclusive au compte McBuleli du titulaire",
      "Espace partenaires : Vue, Membres, Dialogue, Participants",
      "Onglet Préparation : lien badge, to-do, attribution de la 2e place",
      "Live événement (suivi jour J)",
      "Site référence : https://montana-pay.com/",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Compte McBuleli avec montanadelly7@gmail.com - Préparation = badges",
      },
      { label: "Live événement", url: LIVE },
      { label: "Page Hackathon", url: HACKATHON },
      {
        label: "MontanaPay",
        url: "https://montana-pay.com/",
      },
    ],
  },
  {
    id: "kilelo",
    orgSlug: "kilelo",
    hasBadges: true,
    orgName: "Kilelo",
    shortName: "Kilelo",
    to: "support@kileloapp.com",
    status: "confirmed",
    greeting: "Bonjour Jeancy,",
    roleTitle:
      "Partenaire Marketplace Services Locaux - Talk - Mentorat",
    entitlements: [
      "Talk / intervention sur matching, confiance et avis marketplace",
      "Mentorat ciblé des équipes concernées",
      "Visibilité Kilelo sur les supports partenaires",
      "Accès à l'espace d'échange partenaires",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Coordonner talk, mentorat et visibilité",
      },
      { label: "Live événement", url: LIVE },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "ia-academie",
    orgSlug: "ia-academie-chk",
    hasBadges: true,
    orgName: "IA Académie / CHK",
    shortName: "IA Académie",
    to: "contact@ia-academie.cd",
    cc: ["contact@ch-kin.com"],
    status: "confirmed",
    roleTitle: "Partenaire académique - Vivier - Atelier / Mentorat",
    entitlements: [
      "Mobilisation apprenants / alumni",
      "Atelier ou session(s) de mentorat (thème à finaliser)",
      "Option participation jury (à confirmer)",
      "Logo + visibilité sur la page Hackathon",
      "Accès à l'espace d'échange partenaires",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Finaliser contributions (vivier / atelier / jury)",
      },
      { label: "Live événement", url: LIVE },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "tyts",
    orgSlug: "tyts",
    hasBadges: true,
    orgName: "TYTS",
    shortName: "TYTS",
    to: "nsomoneaaron2@gmail.com",
    status: "confirmed",
    roleTitle: "Partenaire Tech / Cybersécurité & réseaux",
    entitlements: [
      "Mentorat cyber / réseaux (selon créneaux retenus)",
      "Option regard jury technique",
      "Pipeline apprenants / talents",
      "Accès à l'espace d'échange partenaires",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Valider les modalités (mentorat / jury / appui)",
      },
      { label: "Live événement", url: LIVE },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "silikin",
    orgSlug: "silikin",
    hasBadges: true,
    orgName: "Silikin Village",
    shortName: "Silikin",
    to: "reception_skv@texaf-rdc.com",
    status: "in_progress",
    roleTitle: "Lieu / hub d'innovation (en finalisation)",
    entitlements: [
      "Accueil de l'événement au Silikin Village (28-29 août 2026)",
      "Coordination logistique sur site",
      "Accès à l'espace d'échange partenaires pour le suivi opérationnel",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Suivi statut partenariat et coordination avec McBuleli",
      },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "e-com-sas",
    orgSlug: "e-com-sas",
    hasBadges: true,
    orgName: "e-COM SAS",
    shortName: "e-COM SAS",
    to: "contact@e-comsas.com",
    cc: ["jean.andre@e-comsas.com"],
    status: "in_progress",
    roleTitle:
      "Partenaire Infrastructure FinTech & e-Paiement (discussion en cours)",
    entitlements: [
      "Proposition : atelier technique intégration paiement sécurisé",
      "Proposition : mentorat équipes FinTech / GovTech",
      "Option : regard jury robustesse transactionnelle",
      "Accès à l'espace d'échange pour finaliser le niveau d'accréditation",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Finaliser le rôle et les contributions retenues",
      },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
  {
    id: "cesar-group",
    orgSlug: "cesar-group",
    hasBadges: true,
    orgName: "César Group",
    shortName: "César Group",
    to: "cesargrouprdc@gmail.com",
    cc: ["contact@cesargroup-rdc.com"],
    status: "in_progress",
    roleTitle: "Partenaire Formation & Employabilité (discussion en cours)",
    entitlements: [
      "Proposition : atelier / mentorat pitch, Office, posture jury",
      "Option mobilité / logistique événement",
      "Logo + relais auprès des apprenants",
      "Accès à l'espace d'échange pour finaliser l'accréditation",
    ],
    links: [
      {
        label: "Espace partenaires",
        url: CHAT,
        note: "Finaliser le rôle après nos échanges",
      },
      { label: "Page Hackathon", url: HACKATHON },
    ],
  },
];

export function findPartnerRoleAnnouncement(
  idOrShort: string,
): PartnerRoleAnnouncement | undefined {
  const key = idOrShort.trim().toLowerCase();
  return PARTNER_ROLE_ANNOUNCEMENTS.find(
    (p) =>
      p.id === key ||
      p.shortName.toLowerCase() === key ||
      p.orgName.toLowerCase() === key,
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowHtml(text: string, bg = "#e8f3ee"): string {
  return `<tr><td style="padding:8px 12px;background:${bg};border-radius:10px;font-size:14px;line-height:1.45;color:#0c0a09;">${text}</td></tr><tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

export function buildPartnerRoleAnnouncementEmail(
  partner: PartnerRoleAnnouncement,
): { subject: string; html: string; text: string } {
  const greeting =
    partner.greeting?.trim() || `Bonjour ${partner.shortName},`;
  const statusLine =
    partner.status === "confirmed"
      ? "Nous confirmons officiellement votre rôle dans le McBuleli Hackathon."
      : "Voici le rôle en discussion pour votre organisation dans le McBuleli Hackathon - à finaliser via l'espace partenaires.";

  const primary = partner.links[0];
  const subject =
    partner.status === "confirmed"
      ? `McBuleli Hackathon × ${partner.shortName} - votre rôle & accès espace`
      : `McBuleli Hackathon × ${partner.shortName} - rôle proposé & espace partenaires`;

  const entitlementRows = partner.entitlements
    .map((e) => rowHtml(esc(e)))
    .join("");

  const linkRows = partner.links
    .map((l) => {
      const note = l.note
        ? `<br /><span style="font-size:12px;color:#57534e;">${esc(l.note)}</span>`
        : "";
      return rowHtml(
        `<strong>${esc(l.label)}</strong> - <a href="${esc(l.url)}" style="color:#305f33;font-weight:700;">${esc(l.url.replace("https://", ""))}</a>${note}`,
        "#f5f5f4",
      );
    })
    .join("");

  const howToRows = [
    rowHtml(
      "<strong>1.</strong> Créez (ou utilisez) un compte McBuleli avec l'<strong>email principal</strong> de votre organisation",
      "#f5f5f4",
    ),
    rowHtml("<strong>2.</strong> Connectez-vous", "#f5f5f4"),
    rowHtml(
      `<strong>3.</strong> Ouvrez <a href="${esc(primary.url)}" style="color:#305f33;font-weight:700;">${esc(primary.label)}</a> - vous y trouverez ce qui vous revient selon votre accréditation`,
      "#f5f5f4",
    ),
  ].join("");

  const hasBadges = partner.hasBadges !== false;
  const badgeUrl = partner.badgePassUrl?.trim() || "";
  const hasBadgeLink = Boolean(badgeUrl);
  const badgeCtaHref = hasBadgeLink ? badgeUrl : primary.url;
  const badgeCtaLabel = hasBadgeLink
    ? "Ouvrir mon badge"
    : `Ouvrir ${primary.label}`;
  const badgeBlockHtml = hasBadges
    ? `
              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0c0a09;">Votre badge partenaire</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr>
                  <td style="padding:14px 16px;background:#f5f5f4;border-radius:12px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.5;font-weight:700;color:#0c0a09;">${esc(partner.roleTitle)}</p>
                    <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#57534e;">
                      Badge officiel (accès porte) - <strong style="color:#0c0a09;">exclusif au titulaire</strong> :
                      seul le compte McBuleli lié à l'email du badge peut l'ouvrir. Un lien partagé ne suffit plus.
                    </p>
                    <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#57534e;">
                      Vous disposez de <strong style="color:#0c0a09;">2 places</strong> : la 1re pour vous, la 2e à octroyer à un collègue dans l'onglet <strong>Préparation</strong> de l'espace partenaires.
                    </p>
                    ${
                      partner.badgeCode
                        ? `<p style="margin:0 0 10px;font-size:12px;color:#57534e;">Code : <strong style="color:#0c0a09;">${esc(partner.badgeCode)}</strong></p>`
                        : ""
                    }
                    ${
                      hasBadgeLink
                        ? `<a href="${esc(badgeUrl)}" style="display:inline-block;padding:10px 18px;border-radius:10px;background:#305f33;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">Ouvrir mon badge</a>`
                        : `<p style="margin:0;font-size:13px;line-height:1.5;color:#57534e;">Votre lien badge personnel sera disponible dans l'onglet <strong style="color:#0c0a09;">Préparation</strong> de l'espace partenaires après connexion.</p>`
                    }
                  </td>
                </tr>
              </table>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#e8f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(partner.roleTitle)} - badge sécurisé & espace préparation.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8f3ee;padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #d6d3d1;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;border-bottom:1px solid #d6d3d1;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="https://mcbuleli.org/brand/logo-256.png" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:17px;font-weight:800;color:#305f33;letter-spacing:-0.02em;">McBuleli</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#57534e;">Hackathon · Rôle & badge</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#0c0a09;">${esc(greeting)}</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#57534e;">
                ${esc(statusLine)}
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                <tr>
                  <td style="padding:14px 16px;background:#e8f3ee;border-radius:12px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#305f33;">Votre rôle</p>
                    <p style="margin:0;font-size:15px;line-height:1.5;font-weight:700;color:#0c0a09;">${esc(partner.roleTitle)}</p>
                  </td>
                </tr>
              </table>
              ${badgeBlockHtml}
              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0c0a09;">Ce qui vous revient</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                ${entitlementRows}
              </table>
              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0c0a09;">Votre espace d'accès</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
                ${linkRows}
              </table>
              <p style="margin:0 0 10px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0c0a09;">Comment y accéder</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
                ${howToRows}
              </table>
              <p style="margin:0 0 18px;padding:10px 12px;background:#fffbeb;border-radius:10px;font-size:13px;line-height:1.5;color:#57534e;">
                <strong style="color:#0c0a09;">Sécurité :</strong>
                badges et tickets officiels ne s'ouvrent qu'avec le compte du titulaire.
                Pour la 2e place, utilisez l'onglet <strong style="color:#0c0a09;">Préparation</strong> (to-do + attribution collègue).
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.5;color:#57534e;">
                <strong style="color:#0c0a09;">28-29 août 2026</strong> · Silikin Village, Kinshasa · 08h00-17h00<br />
                <a href="${esc(HACKATHON)}" style="color:#305f33;font-weight:600;">mcbuleli.org/hackathon</a>
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
                <tr>
                  <td style="border-radius:12px;background:#305f33;">
                    <a href="${esc(hasBadges ? badgeCtaHref : primary.url)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${hasBadges ? esc(badgeCtaLabel) : `Ouvrir ${esc(primary.label)}`}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:15px;line-height:1.55;color:#57534e;">
                Merci de vous connecter dès que possible pour valider les prochains créneaux opérationnels.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <p style="margin:0;font-size:14px;line-height:1.55;color:#0c0a09;">
                Cordialement,<br />
                <strong>McBuleli Team</strong><br />
                Mme Patty B.<br />
                <a href="mailto:hi@mcbuleli.org" style="color:#305f33;">hi@mcbuleli.org</a><br />
                +243 997 366 736 · +243 860 218 521<br />
                <a href="https://wa.me/message/IF6DXNT6Q2VSI1" style="color:#305f33;">WhatsApp</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    greeting,
    "",
    statusLine,
    "",
    `VOTRE RÔLE`,
    partner.roleTitle,
    "",
    ...(hasBadges
      ? [
          `VOTRE BADGE PARTENAIRE`,
          partner.roleTitle,
          `Accès exclusif titulaire (compte = email du badge).`,
          `2 places : vous + 1 collègue (onglet Préparation).`,
          hasBadgeLink
            ? `Badge : ${badgeUrl}`
            : `Badge : disponible dans l'onglet Préparation (${CHAT}) après connexion`,
          partner.badgeCode ? `Code : ${partner.badgeCode}` : "",
          "",
        ].filter(Boolean)
      : []),
    `CE QUI VOUS REVIENT`,
    ...partner.entitlements.map((e) => `- ${e}`),
    "",
    `VOTRE ESPACE D'ACCÈS`,
    ...partner.links.map(
      (l) =>
        `- ${l.label}: ${l.url}${l.note ? ` (${l.note})` : ""}`,
    ),
    "",
    `COMMENT Y ACCÉDER`,
    `1. Compte McBuleli avec l'email principal de votre organisation`,
    `2. Connectez-vous`,
    `3. Ouvrez ${primary.label}: ${primary.url}`,
    "",
    `Sécurité : badge/ticket visibles uniquement par le titulaire. 2e place + to-do = onglet Préparation.`,
    "",
    `28-29 août 2026 · Silikin Village, Kinshasa · 08h00-17h00`,
    HACKATHON,
    "",
    `Ambassadeurs (hors partenaires org): ${AMBASSADEUR}`,
    "",
    `Cordialement,`,
    `McBuleli Team`,
    `Mme Patty B.`,
    `hi@mcbuleli.org`,
    `+243 997 366 736 · +243 860 218 521`,
    `WhatsApp : https://wa.me/message/IF6DXNT6Q2VSI1`,
  ].join("\n");

  return { subject, html, text };
}
