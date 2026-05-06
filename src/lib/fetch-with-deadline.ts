/**
 * Fetch with a hard deadline via AbortController.
 * Prefer this over AbortSignal.timeout — unsupported on older Safari / some WebViews,
 * where login could hang indefinitely with no error.
 */
export async function fetchWithDeadline(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  deadlineMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), deadlineMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(tid);
  }
}
