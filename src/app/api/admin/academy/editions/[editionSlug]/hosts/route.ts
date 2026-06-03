import { NextResponse } from "next/server";
import {
  addEditionCoHostByEmail,
  listEditionHosts,
  removeEditionCoHost,
} from "@/lib/academy-edition-hosts";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { editionSlug } = await ctx.params;
  const hosts = await listEditionHosts(editionSlug);
  return NextResponse.json({ hosts });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { editionSlug } = await ctx.params;
  const json = await req.json().catch(() => null);
  const email = typeof json?.email === "string" ? json.email.trim() : "";
  const programSlug =
    typeof json?.programSlug === "string" ? json.programSlug.trim() : undefined;
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const result = await addEditionCoHostByEmail({
    editionSlug,
    programSlug,
    email,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true, host: result.host });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const u = await getSessionUser();
  if (!u || u.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { editionSlug } = await ctx.params;
  const hostId = new URL(req.url).searchParams.get("hostId")?.trim() ?? "";
  if (!hostId) {
    return NextResponse.json({ error: "hostId required" }, { status: 400 });
  }
  const result = await removeEditionCoHost({ editionSlug, hostId });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
