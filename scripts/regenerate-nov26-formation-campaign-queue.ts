/**
 * Rebuild PENDING queue for the active nov26 formation campaign only.
 *
 *   npx tsx scripts/regenerate-nov26-formation-campaign-queue.ts
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignRecipients,
  hackathonEmailCampaigns,
} from "../src/db";
import {
  generateCampaignRecipients,
} from "../src/lib/hackathon/leads/campaign-service";
import { NOV26_FORMATION_TEMPLATE_KEY } from "../src/lib/hackathon/leads/nov26-formation-personalize";

const EDITION =
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
  const db = getDb();
  const [campaign] = await db
    .select({ id: hackathonEmailCampaigns.id, name: hackathonEmailCampaigns.name })
    .from(hackathonEmailCampaigns)
    .where(
      and(
        eq(hackathonEmailCampaigns.editionId, EDITION),
        eq(hackathonEmailCampaigns.bodyTemplate, NOV26_FORMATION_TEMPLATE_KEY),
        inArray(hackathonEmailCampaigns.status, [
          "APPROVED",
          "SENDING",
          "READY_FOR_REVIEW",
        ]),
      ),
    )
    .orderBy(desc(hackathonEmailCampaigns.createdAt))
    .limit(1);

  if (!campaign) {
    console.error("No active nov26 formation campaign. Run prepare-nov26-formation-lead-campaign.ts --approve");
    process.exit(1);
  }

  // Pause other edition campaigns so daily batch only drains nov26.
  await db
    .update(hackathonEmailCampaigns)
    .set({ status: "PAUSED", updatedAt: new Date() })
    .where(
      and(
        eq(hackathonEmailCampaigns.editionId, EDITION),
        sql`${hackathonEmailCampaigns.id} <> ${campaign.id}::uuid`,
        inArray(hackathonEmailCampaigns.status, [
          "APPROVED",
          "SENDING",
          "READY_FOR_REVIEW",
        ]),
      ),
    );

  await db
    .delete(hackathonCampaignRecipients)
    .where(
      and(
        eq(hackathonCampaignRecipients.campaignId, campaign.id),
        inArray(hackathonCampaignRecipients.status, ["PENDING", "SKIPPED"]),
      ),
    );

  const generate = await generateCampaignRecipients({
    campaignId: campaign.id,
    regenerate: false,
    recontactMode: true,
    claimedCompanyKeys: new Set(),
    claimedEmails: new Set(),
  });

  await db
    .update(hackathonEmailCampaigns)
    .set({
      status: "APPROVED",
      dryRun: false,
      updatedAt: new Date(),
    })
    .where(eq(hackathonEmailCampaigns.id, campaign.id));

  console.log(
    JSON.stringify(
      {
        campaignId: campaign.id,
        name: campaign.name,
        queued: generate.queued,
        skipped: generate.skipped,
        preview: generate.preview.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
