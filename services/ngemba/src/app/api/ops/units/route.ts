import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOpsAuth } from "@/lib/ops/auth";
import {
  getUnit,
  listUnits,
  softAssignUnit,
  releaseUnit,
  unitStats,
  updateUnit,
} from "@/lib/units";
import type { UnitStatus } from "@/lib/units/types";

const STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "EN_ROUTE",
  "ON_SCENE",
  "BUSY",
  "OFFLINE",
  "UNAVAILABLE",
] as const;

export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, { permission: "alerts.list" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as UnitStatus | null;
  const availableOnly = url.searchParams.get("available") === "1";
  const partnerSeedId =
    auth.role === "admin"
      ? url.searchParams.get("partner") || undefined
      : auth.partner?.id || undefined;

  const units = listUnits({
    status: status && STATUSES.includes(status) ? status : undefined,
    availableOnly,
    partnerSeedId,
  });

  return NextResponse.json({
    units,
    stats: unitStats(),
    role: auth.role,
  });
}

const patchBody = z.object({
  id: z.string().min(3).max(120),
  status: z.enum(STATUSES).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  locationLabel: z.string().max(200).nullable().optional(),
  etaMinutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
  assignedSessionId: z.string().max(80).nullable().optional(),
  softAssignSessionId: z.string().max(80).optional(),
  release: z.boolean().optional(),
});

/** Mise a jour statut / position / soft-assign (pas dispatch moteur). */
export async function PATCH(req: Request) {
  const auth = await requireOpsAuth(req, {
    permission: "alerts.patch",
    roles: ["admin", "ngo", "security", "school"],
  });
  if (auth instanceof NextResponse) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const existing = getUnit(parsed.data.id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (
    auth.role !== "admin" &&
    auth.partner?.id &&
    existing.partnerSeedId &&
    existing.partnerSeedId !== auth.partner.id
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (parsed.data.release) {
    const unit = releaseUnit(parsed.data.id);
    return NextResponse.json({ unit });
  }

  if (parsed.data.softAssignSessionId) {
    const unit = softAssignUnit(
      parsed.data.id,
      parsed.data.softAssignSessionId,
      parsed.data.etaMinutes,
    );
    if (!unit) {
      return NextResponse.json({ error: "unit_not_available" }, { status: 409 });
    }
    return NextResponse.json({ unit, softAssign: true });
  }

  const unit = updateUnit(parsed.data.id, {
    status: parsed.data.status,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    locationLabel: parsed.data.locationLabel,
    etaMinutes: parsed.data.etaMinutes,
    assignedSessionId: parsed.data.assignedSessionId,
  });

  return NextResponse.json({ unit });
}
