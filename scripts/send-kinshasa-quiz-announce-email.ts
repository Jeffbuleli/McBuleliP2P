/**
 * Annonce quiz Kinshasa (10 places gratuites) aux Partenaires +
 * confirmation de place aux Ambassadeurs.
 *
 * Preview:
 *   npx tsx scripts/send-kinshasa-quiz-announce-email.ts --preview
 *   npx tsx scripts/send-kinshasa-quiz-announce-email.ts --preview --ambassadors
 *
 * Test:
 *   npx tsx scripts/send-kinshasa-quiz-announce-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-kinshasa-quiz-announce-email.ts --to hi@mcbuleli.org --ambassadors --send
 *
 * Partenaires:
 *   npx tsx scripts/send-kinshasa-quiz-announce-email.ts --all --send
 *
 * Ambassadeurs:
 *   npx tsx scripts/send-kinshasa-quiz-announce-email.ts --ambassadors --send
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS } from "../src/lib/email/partnership/partners-program-update-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const PARTNER_SUBJECT =
  "10 places gratuites via quiz Kinshasa · McBuleli Hackathon";
const AMBASSADOR_SUBJECT =
  "Confirmez votre place + quiz gratuit Kinshasa · McBuleli Hackathon";

/** Aligné sur scripts/send-partner-chat-invite-email.ts (pas d'import script). */
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
    else if (a === "--all") out.all = true;
    else if (a === "--ambassadors") out.ambassadors = true;
    else if (a === "--list") out.list = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function loadDossier(kind: "partners" | "ambassadors") {
  const base = path.join(process.cwd(), "content/email-partnership");
  const stem =
    kind === "ambassadors"
      ? "kinshasa-quiz-ambassador-confirm"
      : "kinshasa-quiz-partner-announce";
  return {
    subject: kind === "ambassadors" ? AMBASSADOR_SUBJECT : PARTNER_SUBJECT,
    html: readFileSync(path.join(base, `${stem}.html`), "utf8"),
    text: readFileSync(path.join(base, `${stem}.txt`), "utf8"),
    stem,
  };
}

async function sendOne(args: {
  to: string;
  label: string;
  cc?: string[];
  kind: "partners" | "ambassadors";
}): Promise<boolean> {
  const dossier = loadDossier(args.kind);
  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
  const archiveBcc = partnershipArchiveBcc(args.to);

  const ok = await sendEmail({
    to: args.to,
    cc: args.cc?.length ? args.cc : undefined,
    subject: dossier.subject,
    html: dossier.html,
    text: dossier.text,
    from,
    replyTo,
    bcc: archiveBcc,
  });
  console.log(
    ok
      ? `✓ ${args.label} → ${args.to}${args.cc?.length ? ` (CC ${args.cc.join(", ")})` : ""}${archiveBcc ? ` · BCC ${archiveBcc}` : ""}`
      : `⨯ ${args.label} → ${args.to}`,
  );
  return ok;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const kind: "partners" | "ambassadors" = args.ambassadors
    ? "ambassadors"
    : "partners";
  const dossier = loadDossier(kind);

  console.log(`Audience: ${kind}`);
  console.log(`Subject: ${dossier.subject}`);
  console.log(
    `HTML: content/email-partnership/${dossier.stem}.html`,
  );
  console.log(`TXT:  content/email-partnership/${dossier.stem}.txt`);

  if (kind === "partners") {
    console.log(`Partenaires (${PARTNER_RECIPIENTS.length}):`);
    for (const r of PARTNER_RECIPIENTS) {
      console.log(
        `  - ${r.label}: ${r.to}${r.cc?.length ? ` (cc ${r.cc.join(", ")})` : ""}`,
      );
    }
  } else {
    console.log(
      `Ambassadeurs (${AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS.length}):`,
    );
    for (const r of AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS) {
      console.log(`  - ${r.org} (${r.code}): ${r.email}`);
    }
  }

  console.log(
    `\nBroadcast Resend (audience): content/email-broadcasts/mcbuleli-hackathon_kinshasa_quiz-fr.html`,
  );

  if (args.list || args.preview || !args.send) {
    console.log(
      `\nTest partenaires: npx tsx scripts/send-kinshasa-quiz-announce-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Test ambassadeurs: npx tsx scripts/send-kinshasa-quiz-announce-email.ts --to ${SUPPORT_EMAIL} --ambassadors --send`,
    );
    console.log(
      `Prod partenaires: npx tsx scripts/send-kinshasa-quiz-announce-email.ts --all --send`,
    );
    console.log(
      `Prod ambassadeurs: npx tsx scripts/send-kinshasa-quiz-announce-email.ts --ambassadors --send`,
    );
    if (args.preview) {
      console.log(
        `\n--- TEXT (${dossier.text.length} chars) ---\n${dossier.text.slice(0, 500)}…`,
      );
    }
    return;
  }

  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  if (kind === "ambassadors") {
    if (args.all || !args.to) {
      let fails = 0;
      for (const r of AMBASSADOR_PROGRAM_UPDATE_RECIPIENTS) {
        const ok = await sendOne({
          to: r.email,
          label: `${r.org} (${r.code})`,
          kind: "ambassadors",
        });
        if (!ok) fails += 1;
      }
      if (fails) process.exit(1);
      return;
    }
  }

  if (args.all) {
    let fails = 0;
    for (const r of PARTNER_RECIPIENTS) {
      const ok = await sendOne({
        to: r.to,
        label: r.label,
        cc: r.cc,
        kind: "partners",
      });
      if (!ok) fails += 1;
    }
    if (fails) process.exit(1);
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to (or use --all / --ambassadors)");
    process.exit(1);
  }
  const ok = await sendOne({ to, label: "test", kind });
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
