/**
 * One test: B2B lead-campaign sample → hi@mcbuleli.org
 *
 *   npx tsx scripts/send-hackathon-lead-test-email.ts --send
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  buildCampaignCtaUrl,
  personalizeLeadEmail,
} from "../src/lib/hackathon/leads/lead-personalize";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
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

async function main() {
  const send = process.argv.includes("--send");
  const to = SUPPORT_EMAIL;

  const personalized = personalizeLeadEmail({
    lead: {
      firstName: "Équipe",
      email: "info@example-tech.cd",
      company: "Exemple Tech Kinshasa",
      jobTitle: "Direction technique",
      location: "Kinshasa",
      skills: ["software", "web", "startup"],
      segment: "developers",
      recommendedProfile: "Développeur / Vibe Coding",
    },
    unsubscribeUrl: "https://mcbuleli.org/hackathon",
    ctaUrl: buildCampaignCtaUrl({
      segment: "developers",
      campaignSlug: "ai-hackathon-2026-test",
    }),
  });

  const subject = `[TEST] ${personalized.subject}`;

  console.log({ to, subject, audience: personalized.facts.audience });

  if (!send) {
    console.log("Pass --send to actually deliver via Resend.");
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
  });

  console.log(ok ? "sent_ok" : "sent_failed");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
