import { createHash } from "node:crypto";

/** Node-only: hashes email for rate-limit keys (not used in Edge middleware). */
export function rateLimitKeyEmail(scope: string, email: string): string {
  const hash = createHash("sha256").update(email.toLowerCase()).digest("hex");
  return `${scope}:email:${hash.slice(0, 32)}`;
}
