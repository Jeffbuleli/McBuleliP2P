/**
 * Fetch with a hard deadline via AbortController.
 * Prefer this over AbortSignal.timeout - unsupported on older Safari / some WebViews,
 * where login could hang indefinitely with no error.
 */
import { maybeRedirectUnauthorized } from "@/lib/auth-return-path";

export async function fetchWithDeadline(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  deadlineMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), deadlineMs);
  try {
    const res = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    maybeRedirectUnauthorized(res, input);
    return res;
  } finally {
    clearTimeout(tid);
  }
}
