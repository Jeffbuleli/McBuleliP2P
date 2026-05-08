import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Pi Developer Portal — **test / sandbox** checklist domain verification (separate from mainnet).
 * Serve the exact key Pi shows for the test row. Production checklist still uses
 * `PI_DOMAIN_VALIDATION_KEY` at `/validation-key.txt`.
 *
 * Public URL: https://YOUR_DOMAIN/validation-key-test.txt (rewrite from next.config)
 */
export async function GET() {
  const key = process.env.PI_DOMAIN_VALIDATION_KEY_TEST?.trim();
  if (!key) {
    return new NextResponse(
      "Set PI_DOMAIN_VALIDATION_KEY_TEST in your hosting environment.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
  return new NextResponse(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
