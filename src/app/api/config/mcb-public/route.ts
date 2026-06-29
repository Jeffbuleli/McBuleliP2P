import { NextResponse } from "next/server";
import { getMcbClaimPublicConfig } from "@/lib/mcb-token-config";

/** Public McB utility token facts (no user balances or secrets). */
export async function GET() {
  return NextResponse.json(getMcbClaimPublicConfig());
}
