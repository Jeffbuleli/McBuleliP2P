import { NextResponse } from "next/server";
import { z } from "zod";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";
import {
  commitLeadImportFromFile,
  hackathonLeadsToCsv,
  listHackathonLeads,
  listHackathonLeadsForExport,
  previewLeadImportFromFile,
} from "@/lib/hackathon/leads/lead-import";
import {
  leadGenStats,
  qualifyHackathonLeads,
} from "@/lib/hackathon/leads/lead-qualify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authError(e: unknown) {
  const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
  return NextResponse.json({ error: msg }, { status: 403 });
}

const MAX_BYTES = 5 * 1024 * 1024;

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return authError(e);
  }

  const url = new URL(req.url);
  const editionId = url.searchParams.get("editionId");
  if (!editionId) {
    return NextResponse.json({ error: "editionId_required" }, { status: 400 });
  }

  if (url.searchParams.get("stats") === "1") {
    const stats = await leadGenStats(editionId);
    return NextResponse.json({ ok: true, ...stats });
  }

  const category = url.searchParams.get("category") || undefined;
  const segment = url.searchParams.get("segment") || undefined;
  const q = url.searchParams.get("q") || undefined;

  if (url.searchParams.get("export") === "csv") {
    const rows = await listHackathonLeadsForExport({
      editionId,
      category,
      segment,
      q,
    });
    const csv = hackathonLeadsToCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="hackathon-leads-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const result = await listHackathonLeads({
    editionId,
    limit: Number(url.searchParams.get("limit") || 100) || 100,
    offset: Number(url.searchParams.get("offset") || 0) || 0,
    category,
    segment,
    q,
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  let admin: { id: string };
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return authError(e);
  }

  const contentType = req.headers.get("content-type") ?? "";

  // JSON actions: qualify / score batch
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const parsed = z
      .object({
        action: z.enum(["qualify"]),
        editionId: z.string().uuid(),
        leadIds: z.array(z.string().uuid()).optional(),
        onlyUnscored: z.boolean().optional(),
      })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    if (parsed.data.action === "qualify") {
      const result = await qualifyHackathonLeads({
        editionId: parsed.data.editionId,
        leadIds: parsed.data.leadIds,
        onlyUnscored: parsed.data.onlyUnscored,
      });
      return NextResponse.json({ ok: true, action: "qualify", ...result });
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "multipart_or_json_required" },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const action = String(form.get("action") || "preview");
  const editionId = String(form.get("editionId") || "");
  const file = form.get("file");

  if (!editionId) {
    return NextResponse.json({ error: "editionId_required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_size_invalid" }, { status: 400 });
  }

  const name = file.name || "leads.csv";
  if (!/\.(csv|xlsx|xls|txt)$/i.test(name)) {
    return NextResponse.json({ error: "unsupported_format" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const updateExisting = String(form.get("updateExisting") || "") === "true";
  const includeAlreadyRegistered =
    String(form.get("includeAlreadyRegistered") || "") === "true";
  const defaultSource =
    String(form.get("defaultSource") || "").trim() || undefined;

  if (action === "preview") {
    const preview = await previewLeadImportFromFile({
      editionId,
      filename: name,
      buffer,
      defaultSource,
    });
    return NextResponse.json({
      ok: true,
      action: "preview",
      summary: preview.summary,
      rows: preview.rows.slice(0, 200),
      truncated: preview.rows.length > 200,
      totalClassified: preview.rows.length,
    });
  }

  if (action === "commit") {
    const result = await commitLeadImportFromFile({
      editionId,
      filename: name,
      buffer,
      createdByUserId: admin.id,
      updateExisting,
      includeAlreadyRegistered,
      defaultSource,
    });

    return NextResponse.json({
      ok: true,
      action: "commit",
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      qualified: result.qualified,
      summary: result.summary,
      leadCount: result.leadIds.length,
    });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
