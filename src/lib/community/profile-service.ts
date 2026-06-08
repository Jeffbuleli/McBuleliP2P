import { eq, inArray } from "drizzle-orm";
import {
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import { grantCommunityProfileSetup } from "@/lib/community/rewards-service";

function slugHandle(base: string, suffix: string): string {
  const clean = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
  const s = (clean.length >= 3 ? clean : "user") + suffix.slice(0, 6);
  return s.slice(0, 32);
}

export type CommunityAuthorView = {
  userId: string;
  handle: string;
  displayName: string;
  showKycBadge: boolean;
  avatarUrl: string | null;
};

export async function ensureCommunityProfile(
  userId: string,
): Promise<CommunityAuthorView> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  if (existing) {
    const [u] = await db
      .select({ avatarUrl: users.avatarUrl, kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return {
      userId,
      handle: existing.handle,
      displayName: existing.displayName,
      showKycBadge:
        existing.showKycBadge && u?.kycStatus === "approved",
      avatarUrl: u?.avatarUrl ?? null,
    };
  }

  const [u] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const displayName =
    u?.displayName?.trim() ||
    u?.email?.split("@")[0]?.slice(0, 32) ||
    "Membre";

  let handle = slugHandle(displayName, userId.replace(/-/g, ""));
  for (let i = 0; i < 5; i++) {
    try {
      await db.insert(communityUserProfiles).values({
        userId,
        handle: i === 0 ? handle : `${handle}${i}`,
        displayName: displayName.slice(0, 64),
        showKycBadge: u?.kycStatus === "approved",
      });
      break;
    } catch {
      handle = slugHandle(displayName, userId.replace(/-/g, "") + String(i));
    }
  }

  await grantCommunityProfileSetup(userId);

  const [created] = await db
    .select()
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  return {
    userId,
    handle: created?.handle ?? handle,
    displayName: created?.displayName ?? displayName,
    showKycBadge: u?.kycStatus === "approved",
    avatarUrl: u?.avatarUrl ?? null,
  };
}

export async function getAuthorsMap(
  userIds: string[],
): Promise<Map<string, CommunityAuthorView>> {
  const uniq = [...new Set(userIds)];
  const map = new Map<string, CommunityAuthorView>();
  if (!uniq.length) return map;

  const db = getDb();
  const profiles = await db
    .select()
    .from(communityUserProfiles)
    .where(inArray(communityUserProfiles.userId, uniq));

  const userRows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(inArray(users.id, uniq));

  const userById = new Map(userRows.map((r) => [r.id, r]));

  for (const id of uniq) {
    const p = profiles.find((x) => x.userId === id);
    const u = userById.get(id);
    if (p) {
      map.set(id, {
        userId: id,
        handle: p.handle,
        displayName: p.displayName,
        showKycBadge: p.showKycBadge && u?.kycStatus === "approved",
        avatarUrl: u?.avatarUrl ?? null,
      });
    } else if (u) {
      map.set(id, {
        userId: id,
        handle: slugHandle(u.displayName ?? u.email, id),
        displayName:
          u.displayName?.trim() || u.email.split("@")[0] || "Membre",
        showKycBadge: u.kycStatus === "approved",
        avatarUrl: u.avatarUrl ?? null,
      });
    }
  }

  return map;
}
