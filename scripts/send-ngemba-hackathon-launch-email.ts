/**
 * NGEMBA post-Hackathon launch - partners, participants, ambassadors, campus.
 *
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --preview
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --list
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --all-partners --send
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --ambassadors --send
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --all-participants --send
 *   npx tsx scripts/send-ngemba-hackathon-launch-email.ts --all --send
 *
 * Lead annuaires: use prepare-ngemba-lead-campaign.ts (60/day @ 08h30 Kinshasa).
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS,
  campusProgramUpdateRecipients,
} from "../src/lib/email/partnership/partners-program-update-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";
import { NGEMBA_LAUNCH_SUBJECT } from "../src/lib/hackathon/leads/ngemba-launch-personalize";

const PARTNER_RECIPIENTS: { label: string; to: string; cc?: string[] }[] = [
  { label: "ILOKWE GROUP", to: "ilokwegroup@gmail.com" },
  { label: "Silikin Village", to: "reception_skv@texaf-rdc.com" },
  { label: "KIMIA Service", to: "kimiaservice896@gmail.com" },
  {
    label: "RDPI Think Tank",
    to: "info@rdpithinktank.org",
    cc: ["maristote@rdpithinktank.org"],
  },
  { label: "Kilelo", to: "support@kileloapp.com" },
  { label: "TYTS", to: "nsomoneaaron2@gmail.com" },
  {
    label: "e-COM SAS",
    to: "contact@e-comsas.com",
    cc: ["jean.andre@e-comsas.com"],
  },
  {
    label: "Cesar Group",
    to: "cesargrouprdc@gmail.com",
    cc: ["contact@cesargroup-rdc.com"],
  },
  { label: "SanJa", to: "josephtokombe@icloud.com" },
  { label: "IA Academie / CHK", to: "contact@ia-academie.cd" },
];

type Recipient = {
  firstName: string;
  email: string;
  source: string;
};

function loadLocalEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    loadEnvFile(envPath);
  } catch {
    /* already loaded */
  }
}

loadLocalEnv();

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--preview") out.preview = true;
    else if (a === "--send") out.send = true;
    else if (a === "--list") out.list = true;
    else if (a === "--all") out.all = true;
    else if (a === "--all-partners") out.allPartners = true;
    else if (a === "--all-participants") out.allParticipants = true;
    else if (a === "--ambassadors") out.ambassadors = true;
    else if (a === "--campus") out.campus = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
    else if (a.startsWith("--limit=")) out.limit = a.slice("--limit=".length);
    else if (a === "--limit" && argv[i + 1]) out.limit = argv[++i];
    else if (a.startsWith("--first-name="))
      out.firstName = a.slice("--first-name=".length);
    else if (a === "--first-name" && argv[i + 1]) out.firstName = argv[++i];
  }
  return out;
}

function vpsAt(sql: string): string {
  const b64 = Buffer.from(sql, "utf8").toString("base64");
  return execSync(
    `ssh -o BatchMode=yes -o ConnectTimeout=25 root@162.35.181.98 "echo ${b64} | base64 -d | docker compose -f /opt/mcbuleli/ops/vps/docker-compose.yml exec -T db psql -U mcbuleli -d mcbuleli -v ON_ERROR_STOP=1 -At"`,
    { encoding: "utf8" },
  ).trim();
}

function parseRows(raw: string, source: string): Recipient[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [firstName, , email] = line.split("\t");
      return {
        firstName: (firstName || "Ami").trim(),
        email: (email || "").trim().toLowerCase(),
        source,
      };
    })
    .filter((r) => r.email.includes("@"));
}

function loadParticipants(): Recipient[] {
  const raw = vpsAt(`
SELECT first_name || E'\\t' || COALESCE(last_name, '') || E'\\t' || email
FROM (
  SELECT DISTINCT ON (lower(r.email))
    r.first_name, r.last_name, r.email
  FROM hackathon_registrations r
  JOIN hackathon_editions e ON e.id = r.edition_id AND e.featured = true
  WHERE r.payment_status IN ('paid', 'reserved')
    AND r.email IS NOT NULL AND trim(r.email) <> ''
  ORDER BY lower(r.email), r.created_at DESC
) t
ORDER BY lower(email);
`);
  return parseRows(raw, "participant");
}

function loadPartnersFromDb(): Recipient[] {
  const raw = vpsAt(`
SELECT COALESCE(split_part(contact_email, '@', 1), 'Partenaire') || E'\\t' || '' || E'\\t' || contact_email
FROM (
  SELECT DISTINCT ON (lower(o.contact_email)) o.contact_email
  FROM hackathon_partner_orgs o
  JOIN hackathon_editions e ON e.id = o.edition_id AND e.featured = true
  WHERE o.status <> 'rejected'
    AND o.contact_email IS NOT NULL AND trim(o.contact_email) <> ''
  UNION
  SELECT DISTINCT ON (lower(p.holder_email)) p.holder_email
  FROM hackathon_partner_passes p
  JOIN hackathon_editions e ON e.id = p.edition_id AND e.featured = true
  WHERE p.holder_email IS NOT NULL AND trim(p.holder_email) <> ''
) u(contact_email)
ORDER BY lower(contact_email);
`);
  return parseRows(raw, "partner-db");
}

function loadStaticPartners(): Recipient[] {
  const out: Recipient[] = [];
  for (const p of PARTNER_RECIPIENTS) {
    out.push({
      firstName: p.label.split(/\s+/)[0] || "Partenaire",
      email: p.to.trim().toLowerCase(),
      source: `partner:${p.label}`,
    });
    for (const cc of p.cc ?? []) {
      out.push({
        firstName: p.label.split(/\s+/)[0] || "Partenaire",
        email: cc.trim().toLowerCase(),
        source: `partner-cc:${p.label}`,
      });
    }
  }
  return out;
}

function loadAmbassadors(): Recipient[] {
  return AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS.map((r) => ({
    firstName: r.org.replace(/^Ambassadeur\s+/i, "").split(/\s+/)[0] || "Ami",
    email: r.email.trim().toLowerCase(),
    source: `ambassador:${r.code}`,
  }));
}

function loadCampus(): Recipient[] {
  return campusProgramUpdateRecipients().map((r) => ({
    firstName: r.org.split(/\s+/)[0] || "Ami",
    email: r.email.trim().toLowerCase(),
    source: `campus:${r.id}`,
  }));
}

function mergeRecipients(groups: Recipient[][]): Recipient[] {
  const map = new Map<string, Recipient>();
  for (const group of groups) {
    for (const r of group) {
      const key = r.email.toLowerCase();
      if (!map.has(key)) {
        map.set(key, r);
        continue;
      }
      const existing = map.get(key)!;
      if (
        existing.firstName === "Ami" ||
        existing.firstName === "Partenaire"
      ) {
        map.set(key, {
          ...existing,
          firstName: r.firstName,
          source: `${existing.source}+${r.source}`,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}

function loadDossier() {
  const base = path.join(process.cwd(), "content/email-broadcasts");
  return {
    html: readFileSync(
      path.join(base, "ngemba-hackathon-launch-fr.html"),
      "utf8",
    ),
    text: readFileSync(
      path.join(base, "ngemba-hackathon-launch-fr.txt"),
      "utf8",
    ),
  };
}

function personalize(html: string, text: string, firstName: string) {
  const first = firstName.trim() || "ami";
  return {
    html: html
      .replace(/\{\{\{contact\.first_name\|ami\}\}\}/g, first)
      .replace(
        /\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g,
        `mailto:${SUPPORT_EMAIL}?subject=Desabonnement%20NGEMBA`,
      ),
    text: text
      .replace(/Bonjour,/g, `Bonjour ${first},`)
      .replace(
        /\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g,
        `mailto:${SUPPORT_EMAIL}?subject=Desabonnement NGEMBA`,
      ),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadDossier();
  const from =
    process.env.AUTH_EMAIL_FROM?.trim() ||
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    "NGEMBA <noreply@mcbuleli.org>";

  console.log(`Subject: ${NGEMBA_LAUNCH_SUBJECT}`);
  console.log(`HTML: content/email-broadcasts/ngemba-hackathon-launch-fr.html`);

  if (args.preview && !args.send && !args.list) {
    console.log("\n--list | --all-partners | --ambassadors | --campus | --all-participants | --all --send");
    return;
  }

  let partners: Recipient[] = [];
  let participants: Recipient[] = [];
  let ambassadors: Recipient[] = [];
  let campus: Recipient[] = [];

  const needDb =
    args.list ||
    args.all ||
    args.allPartners ||
    args.allParticipants ||
    args.ambassadors ||
    args.campus;

  if (needDb) {
    try {
      partners = mergeRecipients([loadStaticPartners(), loadPartnersFromDb()]);
      participants = loadParticipants();
    } catch (e) {
      console.warn(
        "DB VPS unreachable - static partners/ambassadors only:",
        e instanceof Error ? e.message.slice(0, 120) : e,
      );
      partners = loadStaticPartners();
    }
    ambassadors = loadAmbassadors();
    campus = loadCampus();
  }

  if (args.list) {
    console.log(`Partners: ${partners.length}`);
    console.log(`Participants: ${participants.length}`);
    console.log(`Ambassadors: ${ambassadors.length}`);
    console.log(`Campus: ${campus.length}`);
    for (const r of [...partners, ...ambassadors, ...campus].slice(0, 40)) {
      console.log(`  ${r.source}\t${r.email}\t${r.firstName}`);
    }
    return;
  }

  let targets: Recipient[] = [];
  if (typeof args.to === "string" && args.to.trim()) {
    targets = [
      {
        firstName:
          typeof args.firstName === "string" ? args.firstName : "ami",
        email: args.to.trim().toLowerCase(),
        source: "manual",
      },
    ];
  } else if (args.all) {
    targets = mergeRecipients([
      partners,
      participants,
      ambassadors,
      campus,
    ]);
  } else if (args.allPartners) {
    targets = partners;
  } else if (args.allParticipants) {
    targets = participants;
  } else if (args.ambassadors) {
    targets = ambassadors;
  } else if (args.campus) {
    targets = campus;
  } else {
    console.log(
      `\nTest: npx tsx scripts/send-ngemba-hackathon-launch-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `All known: npx tsx scripts/send-ngemba-hackathon-launch-email.ts --all --send`,
    );
    return;
  }

  const limitRaw =
    typeof args.limit === "string" ? Number(args.limit) : NaN;
  if (Number.isFinite(limitRaw) && limitRaw > 0) {
    targets = targets.slice(0, limitRaw);
  }

  console.log(`Targets: ${targets.length}`);

  if (!args.send) {
    for (const r of targets.slice(0, 25)) {
      console.log(`  would send → ${r.email} (${r.source})`);
    }
    if (targets.length > 25) console.log(`  … +${targets.length - 25} more`);
    return;
  }

  if (!canSendViaResendApi()) {
    console.error("Envoi bloque:", resendSendBlockedReason());
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;
  for (const r of targets) {
    const dossier = personalize(html, text, r.firstName);
    const sent = await sendEmail({
      to: r.email,
      subject: NGEMBA_LAUNCH_SUBJECT,
      html: dossier.html,
      text: dossier.text,
      from,
      replyTo: SUPPORT_EMAIL,
      bcc: partnershipArchiveBcc(r.email),
    });
    if (sent) {
      ok += 1;
      console.log(`✓ ${r.email} (${r.source})`);
    } else {
      fail += 1;
      console.error(`✗ ${r.email}`);
      if (fail >= 5) {
        console.error("Stop: too many consecutive Resend failures (quota?).");
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  console.log(`Done: ${ok} sent, ${fail} failed, ${targets.length} targeted`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
