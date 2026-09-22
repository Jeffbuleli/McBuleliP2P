/**
 * NGEMBA × Interpeace - prise de contact partenariat / soutien.
 * https://www.interpeace.org
 */

export const INTERPEACE_CONTACT_EMAIL = "info@interpeace.org";
export const INTERPEACE_URL = "https://www.interpeace.org";
export const INTERPEACE_DRC_URL =
  "https://www.interpeace.org/programme/democratic-republic-of-the-congo/";
export const INTERPEACE_GREAT_LAKES_URL =
  "https://www.interpeace.org/programme/great-lakes/";
export const NGEMBA_URL = "https://ngemba-rdc.org";

export type InterpeaceNgembaEmail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export function buildInterpeaceNgembaEmail(): InterpeaceNgembaEmail {
  const subject =
    "NGEMBA RDC × Interpeace - le numérique au service de la paix en RDC";
  const preheader =
    "Une équipe de développeurs et volontaires présente NGEMBA (paix) et cherche votre soutien pour accélérer la paix par le numérique.";

  const text = `Bonjour l'équipe Interpeace,

Nous vous écrivons depuis McBuleli, une équipe congolaise de développeurs, designers et volontaires engagés dans la lutte pour la paix et la protection citoyenne en République démocratique du Congo.

QUI NOUS SOMMES
Nous construisons NGEMBA RDC (https://ngemba-rdc.org) - « Ngemba » signifie la paix en kikongo. C'est une plateforme numérique de vigilance et d'aide citoyenne : alerte SOS, signalement témoin, mode discret, orientation vers des opérateurs humains (ONG et acteurs de protection), sans remplacer la police, les urgences médicales ni la justice.

NOTRE APPROCHE
Le monde devient chaque jour plus connecté. Nous croyons que le numérique - bien conçu, éthique et ancré localement - peut accélérer ce que les acteurs de paix font déjà sur le terrain :
- réduire le délai entre une situation de danger et une orientation vers l'aide ;
- donner la parole aux communautés dans leurs langues (français, anglais, lingala, kiswahili, tshiluba, kikongo) ;
- renforcer la résilience citoyenne sans créer de panique ni de surveillance abusive ;
- relier jeunes, volontaires tech et organisations de paix autour d'outils concrets.

CE QUE NOUS ADMIRONS CHEZ INTERPEACE
Nous connaissons votre travail de consolidation de la paix en RDC et dans la région des Grands Lacs : médiation inclusive, engagement des jeunes et des femmes, cohésion sociale, gouvernance foncière pacifique, dialogue transfrontalier. Votre approche - partenariats locaux, appropriation communautaire, paix durable - inspire précisément ce que nous voulons soutenir par la technologie.

POURQUOI VOUS ÉCRIRE
Nous ne cherchons pas à remplacer le peacebuilding. Nous cherchons des alliés qui comprennent le terrain, pour que le numérique serve vraiment la paix.
Un soutien d'Interpeace - conseil stratégique, mise en relation, regard critique sur nos outils, ou exploration d'un pilote - serait un levier précieux pour l'humanité : plus de personnes protégées, plus vite, avec dignité.

CE QUE NOUS POUVONS APPORTER
- Une plateforme déjà en ligne (ngemba-rdc.org) et une équipe tech / volontaires motivée
- Une couche citoyenne d'alerte et d'orientation utilisable par des partenaires terrain
- Une volonté d'apprendre de vos méthodes (do no harm, inclusion, appropriation locale)

CE QUE NOUS SOLLICITONS
1) Un échange de 20-30 minutes (visio ou appel) pour vous présenter NGEMBA
2) Votre avis sur la pertinence d'un partenariat / soutien (mentorat, réseaux, pilote, autre)
3) Le contact référent éventuellement le mieux placé (RDC / Grands Lacs / innovation)

Références :
- NGEMBA : https://ngemba-rdc.org
- Interpeace RDC : ${INTERPEACE_DRC_URL}
- Interpeace Grands Lacs : ${INTERPEACE_GREAT_LAKES_URL}

Nous restons à votre disposition, avec respect pour votre mission et votre expertise.

Cordialement,
McBuleli Team
Mme Patty B.
hi@mcbuleli.org
+243 997 366 736 · +243 860 218 521
WhatsApp : https://wa.me/message/IF6DXNT6Q2VSI1
https://ngemba-rdc.org
RCCM : CD/KNG/RCCM/26-A-00382 · ID Nat : G2660507E
`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#e8f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8f3ee;padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #d6d3d1;overflow:hidden;">
        <tr>
          <td style="padding:22px 28px 8px;border-bottom:1px solid #d6d3d1;">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <img src="https://mcbuleli.org/brand/logo-256.png" width="44" height="44" alt="McBuleli" style="display:block;border:0;border-radius:50%;" />
              </td>
              <td style="vertical-align:middle;">
                <p style="margin:0;font-size:17px;font-weight:800;color:#305f33;">McBuleli</p>
                <p style="margin:2px 0 0;font-size:12px;color:#57534e;">NGEMBA RDC × Interpeace · Paix &amp; numérique</p>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 8px;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#0c0a09;">Bonjour l'équipe Interpeace,</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#57534e;">
              Nous vous écrivons depuis <strong style="color:#0c0a09;">McBuleli</strong> :
              une équipe congolaise de <strong style="color:#0c0a09;">développeurs, designers et volontaires</strong>
              engagés dans la lutte pour la paix et la protection citoyenne en RDC.
            </p>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0c0a09;">Qui nous sommes</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#57534e;">
              Nous construisons <strong style="color:#0c0a09;">NGEMBA RDC</strong>
              (<a href="${NGEMBA_URL}" style="color:#305f33;">ngemba-rdc.org</a>) -
              «&nbsp;Ngemba&nbsp;» signifie <strong style="color:#0c0a09;">la paix</strong> en kikongo.
              Plateforme de vigilance et d'aide citoyenne (SOS, témoin, mode discret, orientation vers des opérateurs humains ONG),
              <em>sans remplacer</em> police, urgences médicales ni justice.
            </p>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0c0a09;">Notre approche</p>
            <p style="margin:0 0 10px;font-size:14px;line-height:1.55;color:#57534e;">
              Le monde est de plus en plus connecté. Nous croyons qu'un numérique éthique et ancré localement
              peut accélérer ce que les acteurs de paix font déjà sur le terrain.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
              ${bullet("Réduire le délai entre danger et orientation vers l'aide")}
              ${bullet("Donner la parole aux communautés dans 6 langues (FR, EN, LN, SW, LU, KG)")}
              ${bullet("Renforcer la résilience sans panique ni surveillance abusive")}
              ${bullet("Relier jeunes, volontaires tech et organisations de paix autour d'outils concrets")}
            </table>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0c0a09;">Ce que nous admirons chez Interpeace</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#57534e;">
              Votre travail en
              <a href="${INTERPEACE_DRC_URL}" style="color:#305f33;">RDC</a>
              et dans les
              <a href="${INTERPEACE_GREAT_LAKES_URL}" style="color:#305f33;">Grands Lacs</a>
              - médiation inclusive, jeunes et femmes, cohésion sociale, gouvernance foncière pacifique, dialogue transfrontalier -
              inspire ce que nous voulons soutenir par la technologie : partenariats locaux, appropriation communautaire, paix durable.
            </p>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0c0a09;">Pourquoi vous écrire</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#57534e;">
              Nous ne cherchons pas à remplacer le peacebuilding. Nous cherchons des alliés qui comprennent le terrain,
              pour que le numérique serve vraiment la paix.
              Un soutien d'Interpeace - conseil, réseaux, regard critique, ou exploration d'un pilote -
              serait un levier précieux : <strong style="color:#0c0a09;">plus de personnes protégées, plus vite, avec dignité</strong>.
            </p>

            <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0c0a09;">Ce que nous sollicitons</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
              ${bullet("<strong>1.</strong> Échange de 20-30 min pour présenter NGEMBA")}
              ${bullet("<strong>2.</strong> Votre avis sur un partenariat / soutien (mentorat, réseaux, pilote…)")}
              ${bullet("<strong>3.</strong> Contact référent RDC / Grands Lacs / innovation si pertinent")}
            </table>

            <p style="margin:0 0 22px;text-align:center;">
              <a href="${NGEMBA_URL}" style="display:inline-block;background:#305f33;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:12px;">Découvrir NGEMBA</a>
            </p>

            <p style="margin:0 0 6px;font-size:15px;color:#0c0a09;">Cordialement,</p>
            <p style="margin:0;font-size:15px;line-height:1.55;color:#0c0a09;">
              <strong>McBuleli Team</strong><br />
              Mme Patty B.<br />
              <a href="mailto:hi@mcbuleli.org" style="color:#305f33;text-decoration:none;">hi@mcbuleli.org</a><br />
              +243 997 366 736 · +243 860 218 521<br />
              WhatsApp :
              <a href="https://wa.me/message/IF6DXNT6Q2VSI1" style="color:#305f33;text-decoration:none;">écrire sur WhatsApp</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px 24px;border-top:1px solid #d6d3d1;text-align:center;">
            <p style="margin:0;font-size:11px;color:#57534e;">
              © 2026 McBuleli · RCCM : CD/KNG/RCCM/26-A-00382 · ID Nat : G2660507E<br />
              <a href="${NGEMBA_URL}" style="color:#305f33;text-decoration:none;">ngemba-rdc.org</a>
              · <a href="https://mcbuleli.org" style="color:#305f33;text-decoration:none;">mcbuleli.org</a>
              · <a href="${INTERPEACE_URL}" style="color:#305f33;text-decoration:none;">interpeace.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, preheader, html, text };
}

function bullet(innerHtml: string): string {
  return `<tr><td style="padding:8px 12px;background:#e8f3ee;border-radius:10px;font-size:14px;line-height:1.45;color:#0c0a09;">${innerHtml}</td></tr><tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
