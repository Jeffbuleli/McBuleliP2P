/**
 * Invite partenaires a rejoindre /hackathon/chat.
 *
 * Preview:
 *   npx tsx scripts/send-partner-chat-invite-email.ts --preview
 *
 * Test:
 *   npx tsx scripts/send-partner-chat-invite-email.ts --to hi@mcbuleli.org --send
 *
 * Tous les partenaires du roster (hors demos Binance/pawaPay):
 *   npx tsx scripts/send-partner-chat-invite-email.ts --all --send
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const SUBJECT =
  "McBuleli Hackathon - rejoignez l'espace d'échange partenaires";

/** Contacts org reels (pas les emails demo McBuleli). */
export const PARTNER_CHAT_INVITE_RECIPIENTS: {
  label: string;
  to: string;
  cc?: string[];
}[] = [
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
    else if (a === "--list") out.list = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function loadDossier() {
  const base = path.join(process.cwd(), "content/email-partnership");
  return {
    html: readFileSync(path.join(base, "partner-chat-invite.html"), "utf8"),
    text: readFileSync(path.join(base, "partner-chat-invite.txt"), "utf8"),
  };
}

async function sendOne(to: string, label: string, cc?: string[]) {
  const { html, text } = loadDossier();
  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
  const archiveBcc = partnershipArchiveBcc(to);

  const ok = await sendEmail({
    to,
    cc: cc?.length ? cc : undefined,
    subject: SUBJECT,
    html,
    text,
    from,
    replyTo,
    bcc: archiveBcc,
  });
  console.log(
    ok
      ? `OK ${label} → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`
      : `FAIL ${label} → ${to}`,
  );
  return ok;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { html, text } = loadDossier();

  console.log(`Subject: ${SUBJECT}`);
  console.log(`HTML: content/email-partnership/partner-chat-invite.html`);
  console.log(`TXT:  content/email-partnership/partner-chat-invite.txt`);
  console.log(`Recipients (${PARTNER_CHAT_INVITE_RECIPIENTS.length}):`);
  for (const r of PARTNER_CHAT_INVITE_RECIPIENTS) {
    console.log(
      `  - ${r.label}: ${r.to}${r.cc?.length ? ` (cc ${r.cc.join(", ")})` : ""}`,
    );
  }

  if (args.list || args.preview || !args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-partner-chat-invite-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod:  npx tsx scripts/send-partner-chat-invite-email.ts --all --send`,
    );
    if (args.preview) {
      console.log(`\n--- TEXT (${text.length} chars) ---\n${text.slice(0, 400)}…`);
      console.log(`\n--- HTML (${html.length} chars) ---`);
    }
    return;
  }

  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason() || "Resend not configured");
    process.exit(1);
  }

  if (args.all) {
    let fails = 0;
    for (const r of PARTNER_CHAT_INVITE_RECIPIENTS) {
      const ok = await sendOne(r.to, r.label, r.cc);
      if (!ok) fails += 1;
    }
    if (fails) process.exit(1);
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to (or use --all)");
    process.exit(1);
  }
  const ok = await sendOne(to, "test");
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
