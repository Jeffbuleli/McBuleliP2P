import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    /**
     * Render sets RENDER_GIT_COMMIT for builds from GitHub.
     */
    gitCommit:
      process.env.RENDER_GIT_COMMIT ??
      process.env.GIT_COMMIT ??
      null,
    builtAt: process.env.BUILT_AT ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}

