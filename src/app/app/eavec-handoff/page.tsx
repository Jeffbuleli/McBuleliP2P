import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { signEavecHandoffToken } from "@/lib/eavec-handoff";
import { safeAppRedirectPath } from "@/lib/safe-app-path";

function resolveEavecOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_EAVEC_ORIGIN?.trim().replace(/\/$/, "");
  if (!raw) return "https://e-avec.org";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (
      host === "0.0.0.0" ||
      host === "127.0.0.1" ||
      host === "localhost" ||
      host.endsWith(".local")
    ) {
      return "https://e-avec.org";
    }
    return url.origin;
  } catch {
    return "https://e-avec.org";
  }
}

const EAVEC_ORIGIN = resolveEavecOrigin();

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
