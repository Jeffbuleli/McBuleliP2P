import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { hasRole, getMyMembershipOrNull } from "@/lib/group-savings-permissions";

export async function updateGroupProfile(args: {
  groupId: string;
  actorUserId: string;
  name?: string;
  logoUrl?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  publicDescription?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!hasRole(actor, ["admin"])) {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };

  const patch: Partial<typeof groupSavingsGroups.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (args.name != null) {
    const n = args.name.trim();
    if (n.length < 2 || n.length > 96) return { ok: false, message: "group_invalid_name" };
    patch.name = n;
  }
  if (args.logoUrl !== undefined) {
    if (args.logoUrl && args.logoUrl.length > 600_000) {
      return { ok: false, message: "group_logo_too_large" };
    }
    patch.logoUrl = args.logoUrl;
  }
  if (args.address !== undefined) patch.address = args.address?.trim() || null;
  if (args.contactPhone !== undefined) {
    patch.contactPhone = args.contactPhone?.trim().slice(0, 32) || null;
  }
  if (args.contactEmail !== undefined) {
    patch.contactEmail = args.contactEmail?.trim().slice(0, 128) || null;
  }
  if (args.publicDescription !== undefined) {
    patch.publicDescription = args.publicDescription?.trim().slice(0, 2000) || null;
  }

  await db
    .update(groupSavingsGroups)
    .set(patch)
    .where(eq(groupSavingsGroups.id, args.groupId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "group_profile_updated",
    after: {
      name: patch.name ?? g.name,
      hasLogo: Boolean(patch.logoUrl ?? g.logoUrl),
    },
  });

  return { ok: true };
}
