/**
 * Fix IA Académie / CHK partner affiliation on prod DB.
 *
 * - Primary contact: contact@ia-academie.cd
 * - Seat 1 badge: contact@ia-academie.cd
 * - Seat 2 badge: contact@ch-kin.com (CHK operational contact)
 *
 *   npx tsx scripts/fix-ia-academie-affiliation.ts
 *   npx tsx scripts/fix-ia-academie-affiliation.ts --apply
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { and, eq } from "drizzle-orm";
import { getDb, hackathonPartnerOrgs, hackathonPartnerPasses } from "../src/db";
import { ensurePartnerOrgsSeeded } from "../src/lib/hackathon/partner-chat";
import {
  ensureOrgPartnerPasses,
  grantPartnerSeat2,
  listOrgPasses,
} from "../src/lib/hackathon/partner-passes";

const IA_SLUG = "ia-academie-chk";
const IA_EMAIL = "contact@ia-academie.cd";
const CHK_EMAIL = "contact@ch-kin.com";

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
  const apply = process.argv.includes("--apply");
  const editionId = await ensurePartnerOrgsSeeded();
  if (!editionId) throw new Error("no_edition");

  const db = getDb();
  const [org] = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(
      and(
        eq(hackathonPartnerOrgs.editionId, editionId),
        eq(hackathonPartnerOrgs.slug, IA_SLUG),
      ),
    )
    .limit(1);
  if (!org) throw new Error("ia_academie_org_missing");

  console.log("Before:", {
    contactEmail: org.contactEmail,
    status: org.status,
  });

  if (apply && org.contactEmail.toLowerCase() !== IA_EMAIL) {
    await db
      .update(hackathonPartnerOrgs)
      .set({ contactEmail: IA_EMAIL, updatedAt: new Date() })
      .where(eq(hackathonPartnerOrgs.id, org.id));
    console.log(`Updated contactEmail → ${IA_EMAIL}`);
  }

  const passesBefore = await listOrgPasses(org.id);
  console.log(
    "Passes before:",
    passesBefore.map((p) => ({
      seat: p.seatIndex,
      email: p.holderEmail,
      status: p.status,
      code: p.ticketCode,
    })),
  );

  if (apply) {
    await ensureOrgPartnerPasses(org.id);
    const refreshedOrg = { ...org, contactEmail: IA_EMAIL };
    const seat2 = passesBefore.find((p) => p.seatIndex === 2);
    const chkHasSeat =
      passesBefore.some(
        (p) =>
          p.status === "active" &&
          (p.holderEmail ?? "").toLowerCase() === CHK_EMAIL,
      ) ||
      passesBefore.some(
        (p) => p.seatIndex === 1 && (p.holderEmail ?? "").toLowerCase() === CHK_EMAIL,
      );

    if (!chkHasSeat && seat2 && seat2.status !== "active") {
      await grantPartnerSeat2({
        orgId: org.id,
        granterEmail: IA_EMAIL,
        holderEmail: CHK_EMAIL,
        holderName: "CHK Kinshasa",
      });
      console.log(`Granted seat 2 → ${CHK_EMAIL}`);
    }

    const passesAfter = await listOrgPasses(org.id);
    console.log(
      "Passes after:",
      passesAfter.map((p) => ({
        seat: p.seatIndex,
        email: p.holderEmail,
        status: p.status,
        code: p.ticketCode,
      })),
    );
  } else {
    console.log("\nDry run. Re-run with --apply to update prod DB.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
