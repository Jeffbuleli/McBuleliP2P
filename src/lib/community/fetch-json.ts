/** Client — fetch avec timeout et parse JSON sûr (évite « Unexpected end of JSON input »). */

export async function fetchJson<T extends Record<string, unknown> = Record<string, unknown>>(
  input: RequestInfo,
  init?: RequestInit & { timeoutMs?: number },
): Promise<{ ok: boolean; status: number; data: T }> {
  const timeoutMs = init?.timeoutMs ?? 45_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { timeoutMs: _t, ...fetchInit } = init ?? {};
    const res = await fetch(input, { ...fetchInit, signal: controller.signal });
    const text = await res.text();
    let data: T;
    try {
      data = (text ? JSON.parse(text) : {}) as T;
    } catch {
      throw new Error(res.ok ? "invalid_json" : `http_${res.status}`);
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("timeout");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
