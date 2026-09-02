import { NextResponse } from "next/server";
import { z } from "zod";
import { RDC_PROVINCES } from "@/lib/location/rdc-places";
import {
  geoapifyConfigured,
  resolveManualPlace,
  reverseGeocode,
} from "@/lib/location/geoapify";

const bodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("gps"),
    lat: z.number(),
    lng: z.number(),
  }),
  z.object({
    mode: z.literal("place"),
    provinceId: z.string().min(2),
    cityId: z.string().optional(),
  }),
]);

export async function GET() {
  return NextResponse.json({
    provinces: RDC_PROVINCES.map((p) => ({
      id: p.id,
      name: p.name,
      cities: (p.children ?? []).map((c) => ({ id: c.id, name: c.name })),
    })),
    geoapify: geoapifyConfigured(),
    note: "National RDC places - GPS uses Geoapify or offline nearest city",
  });
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (parsed.data.mode === "gps") {
    const location = await reverseGeocode(parsed.data.lat, parsed.data.lng);
    return NextResponse.json({ location });
  }

  const location = resolveManualPlace(
    parsed.data.provinceId,
    parsed.data.cityId,
  );
  return NextResponse.json({ location });
}
