/**
 * Silikin Village venue reservation - preview / send via Resend.
 *
 *   npx tsx scripts/send-silikin-venue-email.ts --preview
 *   npx tsx scripts/send-silikin-venue-email.ts --to hi@mcbuleli.org --send
 *   npx tsx scripts/send-silikin-venue-email.ts --to reception_skv@texaf-rdc.com --cc j.mika@texaf-rdc.com,ceo@mcbuleli.org --send
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildSilikinVenueReservationEmail,
  SILIKIN_RECEPTION_EMAIL,
  SILIKIN_SPACE_OFFICER_EMAIL,
} from "../src/lib/email/partnership/silikin-venue-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const CEO_EMAIL = "ceo@mcbuleli.org";

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
    else if (a.startsWith("--cc=")) out.cc = a.slice("--cc=".length);
    else if (a === "--cc" && argv[i + 1]) out.cc = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = buildSilikinVenueReservationEmail();
  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });

  writeFileSync(path.join(outDir, "silikin-venue-reservation.html"), email.html, "utf8");
  writeFileSync(path.join(outDir, "silikin-venue-reservation.txt"), email.text, "utf8");
  console.log(`Subject: ${email.subject}`);
  console.log("✓ HTML → content/email-partnership/silikin-venue-reservation.html");

  if (!args.send) {
    console.log(`\nTest: npx tsx scripts/send-silikin-venue-email.ts --to ${SUPPORT_EMAIL} --send`);
    console.log(
      `Prod:  npx tsx scripts/send-silikin-venue-email.ts --to ${SILIKIN_RECEPTION_EMAIL} --cc ${SILIKIN_SPACE_OFFICER_EMAIL},${CEO_EMAIL} --send`,
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

  const cc =
    typeof args.cc === "string" && args.cc.trim()
      ? args.cc.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

  const archiveBcc = partnershipArchiveBcc(to);
  const ok = await sendEmail({
    to,
    cc,
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
  const ccNote = cc?.length ? ` · CC ${cc.join(", ")}` : "";
  console.log(
    `✓ Envoyé via Resend → ${to}${ccNote}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
