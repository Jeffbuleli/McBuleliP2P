/**
 * Prépare la file campagne formation nov26 sur les leads hackathon (DB).
 *
 *   npx tsx scripts/prepare-nov26-formation-lead-campaign.ts
 *   npx tsx scripts/prepare-nov26-formation-lead-campaign.ts --approve
 *
 * Envoi quotidien (80/j, Gmail puis pro) :
 *   npx tsx scripts/send-lead-campaign-daily-batch.ts --editionId=<uuid> --send --limit=80
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { prepareNov26FormationCampaignPack } from "../src/lib/hackathon/leads/campaign-service";

/** Édition hackathon Kinshasa (pool leads lead-gen). */
const DEFAULT_EDITION =
  process.env.HACKATHON_LEADS_EDITION_ID ??
  "8e431de4-f539-4d77-a7d4-ee5d939889ca";

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
  const approve = process.argv.includes("--approve");
  const editionId = DEFAULT_EDITION;

  const pack = await prepareNov26FormationCampaignPack({
    editionId,
    minCategory: "UNQUALIFIED",
    approveLive: approve,
  });

  console.log(
    JSON.stringify(
      {
        editionId,
        pausedPriorCampaigns: pack.paused,
        campaignId: pack.campaignId,
        name: pack.name,
        queued: pack.generate.queued,
        skipped: pack.generate.skipped,
        preview: pack.generate.preview.slice(0, 5),
        approved: pack.approved,
        dailySend:
          "npx tsx scripts/send-lead-campaign-daily-batch.ts --editionId=" +
          editionId +
          " --send --limit=80 --domainMode=gmail_icloud_first",
      },
      null,
      2,
    ),
  );

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
