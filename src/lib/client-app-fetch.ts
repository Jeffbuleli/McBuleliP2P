import { maybeRedirectUnauthorized } from "@/lib/auth-return-path";

/** App client fetch - redirects to login with return path on 401. */
export async function fetchAppApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  maybeRedirectUnauthorized(res, input);
  return res;
}
