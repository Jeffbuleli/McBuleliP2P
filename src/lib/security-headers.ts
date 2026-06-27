/**
 * Central security response headers (middleware + next.config backup).
 * CSP domains must match legitimate third-party embeds (Turnstile, Didit KYC, Jitsi, Pi, R2).
 */
import { mediaPublicOrigins } from "@/lib/media-url";

export function buildContentSecurityPolicy(): string {
  const mediaOrigins = mediaPublicOrigins();
  const imgSources = ["'self'", "data:", "blob:", ...mediaOrigins];
  const mediaSources = ["'self'", "blob:", ...mediaOrigins];

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSources.join(" ")}`,
    `media-src ${mediaSources.join(" ")}`,
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      "wss://live.mcbuleli.org",
      "https://api.minepi.com",
      "https://sandbox.minepi.com",
      "https://challenges.cloudflare.com",
      "https://verification.didit.me",
      "https://verify.didit.me",
      ...mediaOrigins,
    ].join(" "),
    "frame-src 'self' https://challenges.cloudflare.com https://verification.didit.me https://verify.didit.me https://live.mcbuleli.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function securityResponseHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": buildContentSecurityPolicy(),
    "Strict-Transport-Security":
      "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(self)",
    "Cross-Origin-Opener-Policy": "same-origin",
    // No COEP require-corp — blocks Turnstile, Didit, and Jitsi iframes (no CORP from those origins).
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

export function applySecurityHeaders(response: Headers): void {
  for (const [key, value] of Object.entries(securityResponseHeaders())) {
    response.set(key, value);
  }
}
