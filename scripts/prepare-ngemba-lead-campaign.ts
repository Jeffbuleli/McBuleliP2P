/**
 * Prepare + approve NGEMBA launch campaign for hackathon lead annuaires.
 * Daily send: GitHub Actions cron @ 08h30 Africa/Kinshasa (60/day).
 *
 *   npx tsx scripts/prepare-ngemba-lead-campaign.ts --preview
 *   npx tsx scripts/prepare-ngemba-lead-campaign.ts --prepare
 *   npx tsx scripts/prepare-ngemba-lead-campaign.ts --prepare --approve
 *   npx tsx scripts/prepare-ngemba-lead-campaign.ts --send-now
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { prepareNgembaLaunchCampaignPack } from "../src/lib/hackathon/leads/campaign-service";
import {
  LEAD_CAMPAIGN_DAILY_BATCH,
  sendDailyLeadCampaignBatch,
} from "../src/lib/hackathon/leads/campaign-send";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
} from "../src/lib/email/send";

const DEFAULT_EDITION = "8e431de4-f539-4d77-a7d4-ee5d939889ca";

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
  const out: {
    preview?: boolean;
    prepare?: boolean;
    approve?: boolean;
    sendNow?: boolean;
    editionId: string;
    minCategory: string;
  } = {
    editionId: DEFAULT_EDITION,
    minCategory: "C_LOW",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--preview") out.preview = true;
    else if (a === "--prepare") out.prepare = true;
    else if (a === "--approve") out.approve = true;
    else if (a === "--send-now") out.sendNow = true;
    else if (a.startsWith("--editionId="))
      out.editionId = a.slice("--editionId=".length);
    else if (a === "--editionId" && argv[i + 1]) out.editionId = argv[++i];
    else if (a.startsWith("--minCategory="))
      out.minCategory = a.slice("--minCategory=".length);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`Edition: ${args.editionId}`);
  console.log(`Daily batch: ${LEAD_CAMPAIGN_DAILY_BATCH} @ 08h30 Africa/Kinshasa`);
  console.log(`Min category: ${args.minCategory}`);

  if (!args.prepare && !args.sendNow) {
    console.log(`
Preview pack (dry):
  npx tsx scripts/prepare-ngemba-lead-campaign.ts --prepare

Prepare + approve live (cron will send 60/day):
  npx tsx scripts/prepare-ngemba-lead-campaign.ts --prepare --approve

Optional first batch now (counts toward Resend 100/day):
  npx tsx scripts/prepare-ngemba-lead-campaign.ts --send-now
`);
    return;
  }

  if (args.prepare) {
    const pack = await prepareNgembaLaunchCampaignPack({
      editionId: args.editionId,
      minCategory: args.minCategory as "C_LOW",
      approveLive: Boolean(args.approve),
    });
    console.log(`Paused previous campaigns: ${pack.paused}`);
    console.log(`Campaign: ${pack.campaignId}`);
    console.log(`Name: ${pack.name}`);
    console.log(
      `Queued PENDING: ${pack.generate.queued} · skipped: ${pack.generate.skipped}`,
    );
    console.log(`Approved live: ${pack.approved}`);
    for (const p of pack.generate.preview.slice(0, 5)) {
      console.log(`  sample ${p.status} ${p.email} · ${p.subject}`);
    }
  }

  if (args.sendNow) {
    if (!canSendViaResendApi()) {
      console.error("Envoi bloque:", resendSendBlockedReason());
      process.exit(1);
    }
    const result = await sendDailyLeadCampaignBatch({
      editionId: args.editionId,
      limit: LEAD_CAMPAIGN_DAILY_BATCH,
      domainMode: "gmail_icloud_first",
    });
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
