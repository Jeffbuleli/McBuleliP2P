/**
 * Test campagne formation nov26 (lead personnalisé + affiche PJ) → hi@mcbuleli.org
 *
 *   npx tsx scripts/send-nov26-formation-lead-test-email.ts
 *   npx tsx scripts/send-nov26-formation-lead-test-email.ts --send
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildNov26FormationCtaUrl,
  personalizeNov26FormationEmail,
} from "../src/lib/hackathon/leads/nov26-formation-personalize";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import { SUPPORT_EMAIL } from "../src/lib/support-contact";

const POSTER_PATH = path.join(
  process.cwd(),
  "public/events/nov26/affiche.png",
);

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

function posterAttachment() {
  if (!existsSync(POSTER_PATH)) {
    throw new Error(`Affiche manquante: ${POSTER_PATH}`);
  }
  return {
    filename: "McBuleli-Formation-Nov2026-affiche.png",
    content: readFileSync(POSTER_PATH).toString("base64"),
    content_type: "image/png",
  };
}

async function main() {
  const send = process.argv.includes("--send");
  const to = SUPPORT_EMAIL;

  const personalized = personalizeNov26FormationEmail({
    lead: {
      firstName: "Jeff",
      email: "demo@gmail.com",
      company: "Exemple Tech Kinshasa",
      jobTitle: "Fondateur",
      location: "Kinshasa",
      skills: ["software", "startup"],
      segment: "developers",
    },
    unsubscribeUrl: "https://mcbuleli.org/api/hackathon/email/u/test-token",
    ctaUrl: buildNov26FormationCtaUrl({
      segment: "developers",
      clickToken: "test",
    }),
  });

  const subject = `[TEST] ${personalized.subject}`;

  console.log({ to, subject, facts: personalized.facts });

  if (!send) {
    console.log("\nPass --send to deliver via Resend (PJ affiche incluse).");
    process.exit(0);
  }

  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason());
    process.exit(1);
  }

  const ok = await sendEmail({
    to,
    subject,
    html: personalized.html,
    text: personalized.text,
    replyTo: SUPPORT_EMAIL,
    from: `Mme Patty B. - McBuleli <${SUPPORT_EMAIL}>`,
    fileAttachments: [posterAttachment()],
  });

  console.log(ok ? "sent_ok" : "sent_failed");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
