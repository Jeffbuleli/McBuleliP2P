import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

const STATIC_ALLOWED = new Set([
  CANONICAL_PRODUCTION_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function extraOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** Returns the origin if allowed, else null (blocks cross-origin credentialed requests). */
export function resolveAllowedCorsOrigin(
  origin: string | null,
): string | null {
  if (!origin) return null;
  const normalized = origin.replace(/\/$/, "");
  if (STATIC_ALLOWED.has(normalized)) return normalized;
  if (extraOrigins().includes(normalized)) return normalized;
  const render = process.env.RENDER_EXTERNAL_URL?.trim().replace(/\/$/, "");
  if (render && normalized === render) return normalized;
  return null;
}

export function corsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return {};
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}
