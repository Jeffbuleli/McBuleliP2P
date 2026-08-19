import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { signEavecHandoffToken } from "@/lib/eavec-handoff";
import { safeAppRedirectPath } from "@/lib/safe-app-path";

const EAVEC_ORIGIN =
  process.env.NEXT_PUBLIC_EAVEC_ORIGIN?.trim().replace(/\/$/, "") ||
  "https://e-avec.org";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

/** Silent SSO into e-AVEC when user opens AVEC from McBuleli wallet (shared DB). */
export default async function EavecHandoffPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeAppRedirectPath(sp.next?.trim() || "/app/wallet/groups");
  const userId = await getSessionUserId();

  if (!userId) {
    redirect(
      `${EAVEC_ORIGIN}/login?next=${encodeURIComponent(next)}`,
    );
  }

  const token = await signEavecHandoffToken(userId);
  redirect(
    `${EAVEC_ORIGIN}/api/auth/sso?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`,
  );
}
