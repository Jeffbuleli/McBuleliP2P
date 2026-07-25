/**
 * Pack designer Hackathon → Ir Christophe CHIBEMBE
 *
 *   npx tsx scripts/send-hackathon-designer-pack-email.ts --preview
 *   npx tsx scripts/send-hackathon-designer-pack-email.ts --to chibembechristophe@gmail.com --send
 *   npx tsx scripts/send-hackathon-designer-pack-email.ts --to hi@mcbuleli.org --send
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  "McBuleli Hackathon - pack designer (charte, photos CCB, QR JEFF243)";

const TO_DEFAULT = "chibembechristophe@gmail.com";

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

function mimeFor(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function collectAttachments() {
  const pack = path.join(process.cwd(), "content/hackathon-designer-pack");
  const files: { filename: string; content: string; content_type: string }[] =
    [];

  const add = (rel: string, asName?: string) => {
    const abs = path.join(pack, rel);
    if (!existsSync(abs)) throw new Error(`Missing ${abs}`);
    const filename = asName ?? path.basename(rel);
    files.push({
      filename,
      content: readFileSync(abs).toString("base64"),
      content_type: mimeFor(filename),
    });
  };

  add("BRIEF.md");
  add("qr-jeff243-mcbuleli.png");
  for (const f of readdirSync(path.join(pack, "brand"))) {
    add(path.join("brand", f), `brand-${f}`);
  }
  for (const f of readdirSync(path.join(pack, "photos-ccb"))) {
    add(path.join("photos-ccb", f), `ccb-${f}`);
  }
  return files;
}

function buildHtml(): { html: string; text: string } {
  const text = readFileSync(
    path.join(
      process.cwd(),
      "content/hackathon-designer-pack/email-christophe.txt",
    ),
    "utf8",
  );
  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#e8f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8f3ee;padding:28px 16px;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #d6d3d1;overflow:hidden;">
<tr><td style="padding:22px 28px;border-bottom:1px solid #d6d3d1;">
<p style="margin:0;font-size:17px;font-weight:800;color:#305f33;">McBuleli</p>
<p style="margin:4px 0 0;font-size:12px;color:#57534e;">Hackathon · Pack designer RS / vidéo</p>
</td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.55;color:#57534e;">
<p style="margin:0 0 14px;color:#0c0a09;">Bonjour Ir Christophe CHIBEMBE,</p>
<p style="margin:0 0 14px;">Voici le pack pour le <strong style="color:#0c0a09;">poste publicitaire vidéo</strong> du McBuleli Hackathon.</p>
<p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0c0a09;">Comprendre</p>
<p style="margin:0 0 14px;">Bootcamp code avec IA → équipes → défis → jury rigoureux → prix. Silikin Village, 28-29 août 2026.</p>
<p style="margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#0c0a09;">Joints</p>
<p style="margin:0 0 14px;">BRIEF.md · logos brand/ · photos CCB · <strong>QR JEFF243</strong> (logo McBuleli)<br/>
Lien promo : <a href="https://mcbuleli.org/hackathon?promo=JEFF243#register" style="color:#305f33;">mcbuleli.org/hackathon?promo=JEFF243</a></p>
<p style="margin:0 0 14px;">Charte : accent <code>#1f6b43</code> · page <code>#fafaf8</code> · dark <code>#0c1210</code>.</p>
<p style="margin:0;">Cordialement,<br/><strong>McBuleli Team</strong><br/>Mme Patty B. · <a href="mailto:hi@mcbuleli.org" style="color:#305f33;">hi@mcbuleli.org</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { html, text };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = collectAttachments();
  console.log(`Subject: ${SUBJECT}`);
  console.log(`Attachments (${files.length}):`);
  for (const f of files) console.log(`  - ${f.filename}`);

  if (!args.send) {
    console.log(
      `\nSend: npx tsx scripts/send-hackathon-designer-pack-email.ts --to ${TO_DEFAULT} --send`,
    );
    return;
  }

  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason() || "Resend blocked");
    process.exit(1);
  }

  const to =
    (typeof args.to === "string" && args.to.trim()) || TO_DEFAULT;
  const { html, text } = buildHtml();
  const from =
    process.env.PARTNERSHIP_EMAIL_FROM?.trim() ||
    `McBuleli Team <${SUPPORT_EMAIL}>`;
  const replyTo =
    process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
  const archiveBcc = partnershipArchiveBcc(to);

  const ok = await sendEmail({
    to,
    subject: SUBJECT,
    html,
    text,
    from,
    replyTo,
    bcc: archiveBcc,
    fileAttachments: files,
  });
  if (!ok) {
    console.error("FAIL");
    process.exit(1);
  }
  console.log(`OK → ${to}${archiveBcc ? ` (BCC ${archiveBcc})` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
