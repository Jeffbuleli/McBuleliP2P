/**
 * IA Académie - reponse affiliation + logo en ligne.
 *
 *   npx tsx scripts/send-ia-academie-affiliation-reply-email.ts --preview
 *   npx tsx scripts/send-ia-academie-affiliation-reply-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-ia-academie-affiliation-reply-email.ts --to contact@ia-academie.cd --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildIaAcademieAffiliationReplyEmail,
} from "../src/lib/email/partnership/ia-academie-affiliation-reply-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { ensurePartnerOrgsSeeded } from "../src/lib/hackathon/partner-chat";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

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
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = buildIaAcademieAffiliationReplyEmail();

  if (args.send || process.argv.includes("--seed")) {
    await ensurePartnerOrgsSeeded();
    console.log("Partner orgs seeded (logo synced).");
  }

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "ia-academie-affiliation-reply.html"),
    email.html,
    "utf8",
  );
  writeFileSync(
    path.join(outDir, "ia-academie-affiliation-reply.txt"),
    email.text,
    "utf8",
  );

  console.log(`Subject: ${email.subject}`);
  console.log("Preview: content/email-partnership/ia-academie-affiliation-reply.html");

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-ia-academie-affiliation-reply-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      "Prod: npx tsx scripts/send-ia-academie-affiliation-reply-email.ts --to contact@ia-academie.cd --send",
    );
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to");
    process.exit(1);
  }
  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason() || "Resend not configured");
    process.exit(1);
  }

  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;

  const ok = await sendEmail({
    to,
    cc: ["contact@ch-kin.com"],
    subject: email.subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: partnershipArchiveBcc(to),
  });
  if (!ok) {
    console.error("Send failed");
    process.exit(1);
  }
  console.log(`OK → ${to} (cc contact@ch-kin.com)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
