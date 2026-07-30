import { NextResponse } from "next/server";
import { z } from "zod";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";
import {
  commitLeadImportFromFile,
  listHackathonLeads,
  previewLeadImportFromFile,
} from "@/lib/hackathon/leads/lead-import";

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

  const result = await listHackathonLeads({
    editionId,
    limit: Number(url.searchParams.get("limit") || 100) || 100,
    offset: Number(url.searchParams.get("offset") || 0) || 0,
    category: url.searchParams.get("category") || undefined,
    segment: url.searchParams.get("segment") || undefined,
    q: url.searchParams.get("q") || undefined,
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
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "multipart_required" },
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
  const defaultSource = String(form.get("defaultSource") || "").trim() || undefined;

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
      /** Cap preview rows returned to keep payload small */
      rows: preview.rows.slice(0, 200),
      truncated: preview.rows.length > 200,
      totalClassified: preview.rows.length,
    });
  }

  if (action === "commit") {
    const parsedFlags = z
      .object({
        updateExisting: z.boolean().optional(),
        includeAlreadyRegistered: z.boolean().optional(),
      })
      .safeParse({ updateExisting, includeAlreadyRegistered });

    const result = await commitLeadImportFromFile({
      editionId,
      filename: name,
      buffer,
      createdByUserId: admin.id,
      updateExisting: parsedFlags.success
        ? parsedFlags.data.updateExisting
        : false,
      includeAlreadyRegistered: parsedFlags.success
        ? parsedFlags.data.includeAlreadyRegistered
        : false,
      defaultSource,
    });

    return NextResponse.json({
      ok: true,
      action: "commit",
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      summary: result.summary,
      leadCount: result.leadIds.length,
    });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
