import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Pi Developer Portal domain verification: serve the exact key as plain text.
 * Set PI_DOMAIN_VALIDATION_KEY on the server (Render) to the string shown in the portal.
 */
export async function GET() {
  const key = process.env.PI_DOMAIN_VALIDATION_KEY?.trim();
  if (!key) {
    return new NextResponse(
      "Set PI_DOMAIN_VALIDATION_KEY in your hosting environment.",
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
