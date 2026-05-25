import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { createGroup } from "@/lib/group-savings-service";
import { isAppCountryCode } from "@/lib/country-codes";
import { AVEC_MAX_SHARES_PER_MEETING } from "@/lib/group-savings-types";

const bodyZ = z.object({
  name: z.string().trim().min(2, "group_invalid_name").max(96),
  countryCode: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === "") return null;
      return isAppCountryCode(v) ? v : null;
    }),
  minMembers: z.coerce.number().int().min(2).max(100),
  maxMembers: z.coerce.number().int().min(2).max(100),
  contributionAmountUsdt: z.coerce.number().positive(),
  cycleDurationDays: z.coerce.number().int().min(7).max(365),
  maxSharesPerMeeting: z.coerce
    .number()
    .int()
    .min(1)
    .max(AVEC_MAX_SHARES_PER_MEETING)
    .optional(),
  meetingIntervalDays: z.coerce.number().int().min(1).max(30).optional(),
  socialFundUsdt: z.coerce.number().min(0).optional(),
  paymentRules: z.string().max(2000).optional().nullable(),
  publicDescription: z.string().max(2000).optional().nullable(),
  feeConsentAuthorized: z
    .boolean()
    .refine((v) => v === true, { message: "group_fee_consent_required" }),
});

function validationErrorCode(err: z.ZodError): string {
  const issue = err.issues[0];
  if (typeof issue?.message === "string" && issue.message.startsWith("group_")) {
    return issue.message;
  }
  const path = issue?.path[0];
  if (path === "name") return "group_invalid_name";
  if (path === "minMembers" || path === "maxMembers") return "group_invalid_members";
  if (path === "contributionAmountUsdt") return "group_invalid_contribution";
  if (path === "cycleDurationDays") return "group_invalid_cycle";
  return "group_invalid_body";
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kyc = await checkKycGate(userId, "groups");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: validationErrorCode(parsed.error) },
      { status: 400 },
    );
  }
  if (parsed.data.maxMembers < parsed.data.minMembers) {
    return NextResponse.json({ error: "group_invalid_members" }, { status: 400 });
  }
  try {
    const r = await createGroup({ userId, type: "avec", ...parsed.data });
    if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
    return NextResponse.json({
      ok: true,
      groupId: r.groupId,
      status: r.status,
      feeWaived: r.feeWaived,
    });
  } catch (err) {
    console.error("[POST /api/groups]", err);
    return NextResponse.json({ error: "group_create_failed" }, { status: 500 });
  }
}
