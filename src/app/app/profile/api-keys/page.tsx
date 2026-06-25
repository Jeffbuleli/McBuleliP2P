import { ProfileApiKeysClient } from "@/components/profile/profile-api-keys-client";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDb, users } from "@/db";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";
import { getSessionUserId } from "@/lib/session";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProfileApiKeysPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const userId = await getSessionUserId();
  let tradeLiveEnabled = false;
  let isSuperAdmin = false;
  if (userId) {
    const db = getDb();
    const [row] = await db
      .select({ tradeLiveEnabled: users.tradeLiveEnabled })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    tradeLiveEnabled = row?.tradeLiveEnabled ?? false;
    isSuperAdmin = await isSuperAdminUserId(userId);
  }

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_api_keys_title}
        subtitle={d.profile_api_keys_sub}
      />
      <ProfileApiKeysClient
        tradeLiveEnabled={tradeLiveEnabled}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  );
}
