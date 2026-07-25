/**
 * Annonce programme confirmé (logos page Hackathon).
 *
 * Preview:
 *   npx tsx scripts/send-partners-program-update-email.ts --preview
 *
 * Test:
 *   npx tsx scripts/send-partners-program-update-email.ts --to hi@mcbuleli.org --send
 *
 * Partenaires (7, sans Silikin):
 *   npx tsx scripts/send-partners-program-update-email.ts --all --send
 *
 * Ambassadeurs (hors liste des 7 partenaires):
 *   npx tsx scripts/send-partners-program-update-email.ts --ambassadors --send
 *
 * Relais campus (hors 7 partenaires):
 *   npx tsx scripts/send-partners-program-update-email.ts --campus --send
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  ambassadorProgramUpdateRecipients,
  buildPartnersProgramUpdateEmail,
  campusProgramUpdateRecipients,
  featuredPartnersForEmail,
  PARTNER_PROGRAM_UPDATE_RECIPIENTS,
} from "../src/lib/email/partnership/partners-program-update-email";
import { partnershipArchiveBcc } from "../src/lib/email/partnership/partnership-email-config";
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

function parseArgs(argv: string[]) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--preview") out.preview = true;
    else if (a === "--send") out.send = true;
    else if (a === "--all") out.all = true;
    else if (a === "--ambassadors") out.ambassadors = true;
    else if (a === "--campus") out.campus = true;
    else if (a === "--list") out.list = true;
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
  }
  return out;
}

function logoAttachments() {
  return featuredPartnersForEmail().map((p) => {
    const abs = path.join(process.cwd(), "public", p.publicPath);
    if (!existsSync(abs)) {
      throw new Error(`Logo manquant: ${abs}`);
    }
    return {
      filename: path.basename(p.publicPath),
      content: readFileSync(abs).toString("base64"),
      content_id: p.cid,
      content_type: p.contentType,
    };
  });
}

async function sendOne(args: {
  to: string;
  cc?: string[];
  label: string;
  audience: "partners" | "ambassadors" | "campus";
}): Promise<boolean> {
  const email = buildPartnersProgramUpdateEmail({
    useInlineLogos: true,
    audience: args.audience,
  });
  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
  const archiveBcc = partnershipArchiveBcc(args.to);

  const ok = await sendEmail({
    to: args.to,
    cc: args.cc?.length ? args.cc : undefined,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from,
    replyTo,
    bcc: archiveBcc,
    inlineAttachments: logoAttachments(),
  });
  if (!ok) {
    console.error(`⨯ Échec → ${args.label} <${args.to}>`);
    return false;
  }
  console.log(
    `✓ ${args.label} → ${args.to}${args.cc?.length ? ` (CC ${args.cc.join(", ")})` : ""}${archiveBcc ? ` · BCC ${archiveBcc}` : ""}`,
  );
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ambassadors = ambassadorProgramUpdateRecipients();
  const campus = campusProgramUpdateRecipients();
  const audience: "partners" | "ambassadors" | "campus" = args.campus
    ? "campus"
    : args.ambassadors
      ? "ambassadors"
      : "partners";
  const emailPreview = buildPartnersProgramUpdateEmail({
    useInlineLogos: false,
    audience,
  });

  const outDir = path.join(process.cwd(), "content/email-partnership");
  mkdirSync(outDir, { recursive: true });
  const previewBase =
    audience === "campus"
      ? "campus-program-update"
      : audience === "ambassadors"
        ? "ambassadors-program-update"
        : "partners-program-update";
  writeFileSync(path.join(outDir, `${previewBase}.html`), emailPreview.html, "utf8");
  writeFileSync(path.join(outDir, `${previewBase}.txt`), emailPreview.text, "utf8");

  console.log(`Subject: ${emailPreview.subject}`);
  console.log(`Audience: ${audience}`);
  console.log(`✓ Preview → content/email-partnership/${previewBase}.html`);
  console.log(
    `Logos page: ${featuredPartnersForEmail().map((p) => p.name).join(" · ")}`,
  );
  console.log(
    `Partenaires (${PARTNER_PROGRAM_UPDATE_RECIPIENTS.length}): ${PARTNER_PROGRAM_UPDATE_RECIPIENTS.map((r) => r.org).join(", ")}`,
  );
  console.log(
    `Ambassadeurs hors 7 (${ambassadors.length}): ${ambassadors.map((r) => r.email).join(", ") || "(aucun)"}`,
  );
  console.log(
    `Campus hors 7 (${campus.length}): ${campus.map((r) => r.id).join(", ")}`,
  );

  if (args.list) {
    console.log("\nPartenaires:");
    for (const r of PARTNER_PROGRAM_UPDATE_RECIPIENTS) {
      console.log(
        `- ${r.org}: ${r.email}${r.cc?.length ? ` · CC ${r.cc.join(", ")}` : ""}`,
      );
    }
    console.log("\nAmbassadeurs (hors 7):");
    for (const r of ambassadors) {
      console.log(`- ${r.org} (${r.code}): ${r.email}`);
    }
    console.log("\nCampus (hors 7):");
    for (const r of campus) {
      console.log(`- ${r.id} · ${r.org}: ${r.email}`);
    }
    return;
  }

  if (!args.send) {
    console.log(
      `\nTest: npx tsx scripts/send-partners-program-update-email.ts --to ${SUPPORT_EMAIL} --send`,
    );
    console.log(
      `Partenaires: npx tsx scripts/send-partners-program-update-email.ts --all --send`,
    );
    console.log(
      `Ambassadeurs: npx tsx scripts/send-partners-program-update-email.ts --ambassadors --send`,
    );
    console.log(
      `Campus: npx tsx scripts/send-partners-program-update-email.ts --campus --send`,
    );
    return;
  }

  process.env.RESEND_ALLOW_SEND = "true";
  if (!canSendViaResendApi()) {
    console.error("Envoi bloqué:", resendSendBlockedReason());
    process.exit(1);
  }

  if (args.campus) {
    if (!campus.length) {
      console.error("Aucun contact campus à envoyer.");
      process.exit(1);
    }
    let okCount = 0;
    for (const r of campus) {
      const ok = await sendOne({
        to: r.email,
        label: `${r.org} (${r.id})`,
        audience: "campus",
      });
      if (ok) okCount += 1;
    }
    console.log(`\nDone campus: ${okCount}/${campus.length}`);
    if (okCount < campus.length) process.exit(1);
    return;
  }

  if (args.ambassadors) {
    if (!ambassadors.length) {
      console.error("Aucun ambassadeur à envoyer (liste vide après exclusion des 7).");
      process.exit(1);
    }
    let okCount = 0;
    for (const r of ambassadors) {
      const ok = await sendOne({
        to: r.email,
        label: `${r.org} · ${r.code}`,
        audience: "ambassadors",
      });
      if (ok) okCount += 1;
    }
    console.log(`\nDone ambassadeurs: ${okCount}/${ambassadors.length}`);
    if (okCount < ambassadors.length) process.exit(1);
    return;
  }

  if (args.all) {
    let okCount = 0;
    for (const r of PARTNER_PROGRAM_UPDATE_RECIPIENTS) {
      const ok = await sendOne({
        to: r.email,
        cc: r.cc,
        label: r.org,
        audience: "partners",
      });
      if (ok) okCount += 1;
    }
    console.log(`\nDone partenaires: ${okCount}/${PARTNER_PROGRAM_UPDATE_RECIPIENTS.length}`);
    if (okCount < PARTNER_PROGRAM_UPDATE_RECIPIENTS.length) process.exit(1);
    return;
  }

  const to = typeof args.to === "string" ? args.to.trim() : "";
  if (!to) {
    console.error("Missing --to (or use --all / --ambassadors / --campus)");
    process.exit(1);
  }

  const ok = await sendOne({
    to,
    label: "Test",
    audience,
  });
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
