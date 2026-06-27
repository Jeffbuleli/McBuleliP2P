import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeAppRedirectPath } from "@/lib/safe-app-path";

/** Server redirect — preserve requested app path via middleware `x-pathname`. */
export async function redirectToLoginPreservingPath(): Promise<never> {
  const h = await headers();
  const next = safeAppRedirectPath(h.get("x-pathname"));
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
