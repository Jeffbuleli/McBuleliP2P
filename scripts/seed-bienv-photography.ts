/**
 * Seed Bienv Photography org, badge médias, promo BIENV_PHOTO_243.
 *
 *   npx tsx scripts/seed-bienv-photography.ts
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { ensureBienvPhotographyAssets } from "../src/lib/hackathon/bienv-photography";

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
  const assets = await ensureBienvPhotographyAssets();
  console.log("Bienv Photography 243 — seed OK");
  console.log(`  orgId: ${assets.orgId}`);
  console.log(`  badge: ${assets.badgeCode} → ${assets.badgePassUrl}`);
  console.log(`  promo: ${assets.promoCode}`);
  console.log(`  share: ${assets.shareUrl}`);
  console.log(`  dashboard: ${assets.dashboardUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
