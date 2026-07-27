/**
 * Bienv Photography 243 — seed badge + promo, preview / send.
 *
 *   npx tsx scripts/send-bienv-photography-email.ts
 *   npx tsx scripts/send-bienv-photography-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-bienv-photography-email.ts --to bienvngonda862@gmail.com --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildBienvPhotographyEmail,
} from "../src/lib/email/partnership/bienv-photography-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import {
  BIENV_PHOTO_EMAIL,
  ensureBienvPhotographyAssets,
} from "../src/lib/hackathon/bienv-photography";
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
    else if (a === "--seed-only") out.seedOnly = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const assets = await ensureBienvPhotographyAssets();
  const email = buildBienvPhotographyEmail(assets);

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "bienv-photography.html"), email.html, "utf8");
  writeFileSync(path.join(outDir, "bienv-photography.txt"), email.text, "utf8");

  console.log(`Subject: ${email.subject}`);
  console.log(`Badge: ${assets.badgeCode} → ${assets.badgePassUrl}`);
  console.log(`Promo: ${assets.promoCode}`);
  console.log(`Dashboard: ${assets.dashboardUrl}`);
  console.log("✓ HTML → content/email-partnership/bienv-photography.html");

  if (args.seedOnly) {
    console.log("Seed OK (no email sent).");
    return;
  }

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-bienv-photography-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Prod: npx tsx scripts/send-bienv-photography-email.ts --to ${BIENV_PHOTO_EMAIL} --send`,
    );
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to");
    process.exit(1);
  }
  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;

  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: archiveBcc,
  });
  if (!ok) {
    console.error("Échec Resend");
    process.exit(1);
  }
  console.log(`✓ Envoyé via Resend → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
