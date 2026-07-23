/**
 * Seed / confirm a partner promo code and email the partner.
 *
 * Test McBuleli → hi@:
 *   npx tsx scripts/send-partner-promo-confirm-email.ts --code McBuleli --to hi@mcbuleli.org --send
 *
 * Preview only:
 *   npx tsx scripts/send-partner-promo-confirm-email.ts --code McBuleli --preview
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { eq } from "drizzle-orm";
import { getDb, hackathonEditions } from "../src/db";
import { buildPartnerPromoConfirmEmail } from "../src/lib/email/partnership/partner-promo-confirm-email";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
  sendEmail,
} from "../src/lib/email/send";
import {
  partnerDashboardUrl,
  partnerShareUrl,
  upsertPartnerPromo,
} from "../src/lib/hackathon/promo";
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
    else if (a.startsWith("--code=")) out.code = a.slice("--code=".length);
    else if (a === "--code" && argv[i + 1]) out.code = argv[++i];
    else if (a.startsWith("--to=")) out.to = a.slice("--to=".length);
    else if (a === "--to" && argv[i + 1]) out.to = argv[++i];
    else if (a.startsWith("--org=")) out.org = a.slice("--org=".length);
    else if (a === "--org" && argv[i + 1]) out.org = argv[++i];
    else if (a.startsWith("--name=")) out.name = a.slice("--name=".length);
    else if (a === "--name" && argv[i + 1]) out.name = argv[++i];
  }
  return out;
}

async function resolveEditionId(): Promise<string> {
  const db = getDb();
  const [featured] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .limit(1);
  if (featured?.id) return featured.id;
  const [any] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .limit(1);
  if (!any?.id) throw new Error("Aucune edition hackathon en base.");
  return any.id;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const code = String(args.code || "McBuleli");
  const to = String(args.to || SUPPORT_EMAIL).trim().toLowerCase();
  const orgName = String(args.org || "McBuleli");
  const partnerName = args.name ? String(args.name) : "Equipe McBuleli";

  const editionId = await resolveEditionId();
  const promo = await upsertPartnerPromo({
    editionId,
    code,
    orgName,
    partnerEmail: to,
    partnerName,
    discountPercent: 10,
    cashbackUsd: 10,
  });

  const shareUrl = partnerShareUrl(promo.code);
  const dashboardUrl = partnerDashboardUrl(promo.dashboardToken);
  const email = buildPartnerPromoConfirmEmail({
    orgName: promo.orgName,
    partnerName,
    partnerEmail: promo.partnerEmail,
    code: promo.code,
    discountPercent: promo.discountPercent,
    cashbackUsd: promo.cashbackUsd,
    priceUsd: promo.priceUsd,
    shareUrl,
    dashboardUrl,
  });

  const outDir = path.resolve(
    process.cwd(),
    "content/email-partnership/partner-promo",
  );
  mkdirSync(outDir, { recursive: true });
  const slug = promo.code.toLowerCase();
  writeFileSync(path.join(outDir, `${slug}.html`), email.html, "utf8");
  writeFileSync(path.join(outDir, `${slug}.txt`), email.text, "utf8");
  console.log(`[preview] ${path.join(outDir, `${slug}.html`)}`);
  console.log(`[share] ${shareUrl}`);
  console.log(`[dashboard] ${dashboardUrl}`);

  if (args.preview && !args.send) {
    console.log("Preview only (no send).");
    return;
  }

  if (!args.send) {
    console.log("Ajoutez --send pour envoyer, ou --preview pour ecrire les fichiers.");
    return;
  }

  if (!canSendViaResendApi()) {
    console.error(resendSendBlockedReason() || "Envoi bloque.");
    process.exit(1);
  }

  const ok = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    from: `McBuleli <${SUPPORT_EMAIL}>`,
    replyTo: SUPPORT_EMAIL,
  });

  if (!ok) {
    console.error("Echec envoi email.");
    process.exit(1);
  }
  console.log(`Envoye a ${to} - code ${promo.code}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
