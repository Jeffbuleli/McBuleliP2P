/**
 * Merci post-hackathon · galerie HD · rappel livrables.
 *
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --list
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --all-participants --send
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --all-partners --send
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --all --send
 *   npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --export-broadcast
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { buildHackathonThankYouGalleryEmail } from "../src/lib/email/partnership/hackathon-thank-you-gallery-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

/** Aligné scripts/send-kinshasa-quiz-announce-email.ts */
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
  lastName: string;
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
    else if (a === "--all-participants") out.allParticipants = true;
    else if (a === "--all-partners") out.allPartners = true;
    else if (a === "--export-broadcast") out.exportBroadcast = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
    else if (a.startsWith("--first-name=")) out.firstName = a.slice("--first-name=".length);
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
      const [firstName, lastName, email] = line.split("\t");
      return {
        firstName: (firstName || "Ami").trim(),
        lastName: (lastName || "").trim(),
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
      lastName: "",
      email: p.to.trim().toLowerCase(),
      source: `partner:${p.label}`,
    });
    for (const cc of p.cc ?? []) {
      out.push({
        firstName: p.label.split(/\s+/)[0] || "Partenaire",
        lastName: "",
        email: cc.trim().toLowerCase(),
        source: `partner-cc:${p.label}`,
      });
    }
  }
  return out;
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
      if (existing.firstName === "Ami" || existing.firstName === "Partenaire") {
        map.set(key, { ...existing, firstName: r.firstName, source: `${existing.source}+${r.source}` });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
}

function exportBroadcastFiles(): void {
  const dossier = buildHackathonThankYouGalleryEmail({
    resendAudience: true,
    medium: "broadcast",
  });
  const slug = "mcbuleli-hackathon_thank_you_gallery-fr";
  const outDir = path.join(process.cwd(), "content/email-broadcasts");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, `${slug}.html`), dossier.html, "utf8");
  writeFileSync(path.join(outDir, `${slug}.txt`), dossier.text, "utf8");
  writeFileSync(
    path.join(outDir, `${slug}.json`),
    JSON.stringify(
      {
        name: "McBuleli · hackathon_thank_you_gallery (FR)",
        subject: dossier.subject,
        kind: "hackathon_thank_you_gallery",
        locale: "fr",
        preheader: `Merci pour le hackathon · galerie HD · rappel livrables · prototypes bientôt.`,
        cta: "https://mcbuleli.org/hackathon/gallery?utm_source=email&utm_medium=broadcast&utm_campaign=thank_you_gallery",
      },
      null,
      2,
    ),
    "utf8",
  );

  const indexPath = path.join(outDir, "index.json");
  if (existsSync(indexPath)) {
    const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
      generatedAt: string;
      broadcasts: { slug: string; name: string; subject: string; html: string }[];
    };
    const entry = {
      slug,
      name: "McBuleli · hackathon_thank_you_gallery (FR)",
      subject: dossier.subject,
      html: `${slug}.html`,
    };
    index.broadcasts = index.broadcasts.filter((b) => b.slug !== slug);
    index.broadcasts.push(entry);
    index.generatedAt = new Date().toISOString();
    writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf8");
  }
  console.log(`Broadcast files → content/email-broadcasts/${slug}.*`);
  console.log(`Draft:  npx tsx scripts/send-marketing-broadcast.mjs --kind hackathon_thank_you_gallery --locale fr --preview`);
  console.log(`Create: npx tsx scripts/send-marketing-broadcast.mjs --kind hackathon_thank_you_gallery --locale fr`);
  console.log(`Send:   RESEND_ALLOW_SEND=true npx tsx scripts/send-marketing-broadcast.mjs --kind hackathon_thank_you_gallery --locale fr --send`);
}

async function sendOne(r: Recipient): Promise<boolean> {
  const dossier = buildHackathonThankYouGalleryEmail({
    firstName: r.firstName,
    medium: "hackathon",
  });
  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;

  const ok = await sendEmail({
    to: r.email,
    subject: dossier.subject,
    html: dossier.html,
    text: dossier.text,
    from,
    replyTo,
    bcc: partnershipArchiveBcc(r.email),
  });
  console.log(ok ? `✓ ${r.firstName} → ${r.email} (${r.source})` : `⨯ ${r.firstName} → ${r.email}`);
  return ok;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.exportBroadcast) {
    exportBroadcastFiles();
    return;
  }

  const participants = loadParticipants();
  const partners = mergeRecipients([loadStaticPartners(), loadPartnersFromDb()]);
  const everyone = mergeRecipients([participants, partners]);

  console.log(`Participants: ${participants.length}`);
  console.log(`Partenaires:  ${partners.length}`);
  console.log(`Total unique: ${everyone.length}`);

  if (args.list || (!args.send && !args.to)) {
    for (const r of everyone) {
      console.log(`  - ${r.firstName} ${r.lastName} <${r.email}> [${r.source}]`);
    }
    console.log("\nSend:");
    console.log("  npx tsx scripts/send-hackathon-thank-you-gallery-email.ts --all --send");
    return;
  }

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  const sample = buildHackathonThankYouGalleryEmail({
    firstName: typeof args.firstName === "string" ? args.firstName : "Jeff",
  });
  writeFileSync(path.join(outDir, "hackathon-thank-you-gallery.html"), sample.html, "utf8");
  writeFileSync(path.join(outDir, "hackathon-thank-you-gallery.txt"), sample.text, "utf8");
  console.log(`Subject: ${sample.subject}`);

  if (!args.send) return;

  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason());
    process.exit(1);
  }

  let targets: Recipient[] = [];
  if (args.all) targets = everyone;
  else if (args.allParticipants) targets = participants;
  else if (args.allPartners) targets = partners;
  else if (typeof args.to === "string") {
    const email = args.to.trim().toLowerCase();
    const match = everyone.find((r) => r.email === email);
    targets = [
      {
        firstName:
          (typeof args.firstName === "string" && args.firstName) ||
          match?.firstName ||
          "Ami",
        lastName: match?.lastName || "",
        email,
        source: match?.source || "manual",
      },
    ];
  } else {
    console.error("ERROR: use --all, --all-participants, --all-partners, or --to");
    process.exit(1);
  }

  let fails = 0;
  for (let i = 0; i < targets.length; i++) {
    const ok = await sendOne(targets[i]!);
    if (!ok) fails += 1;
    if (i < targets.length - 1) await sleep(350);
  }

  exportBroadcastFiles();
  console.log(`\nDone: ${targets.length - fails}/${targets.length} sent`);
  if (fails) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
