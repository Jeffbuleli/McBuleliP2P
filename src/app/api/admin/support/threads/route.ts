import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getSessionUser, StaffAuthError } from "@/lib/session-user";
import {
  listSupportThreadsForStaffPaginated,
  type SupportThreadSort,
} from "@/lib/support-service";

function parseSort(s: string | null): SupportThreadSort {
  if (s === "lastMessage" || s === "unread" || s === "status" || s === "urgency")
    return s;
  return "urgency";
}

function parseLimit(n: number): 10 | 20 | 30 {
  if (n === 10 || n === 20 || n === 30) return n;
  return 20;
}

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const u = await getSessionUser();
    if (!u || (u.role !== "agent" && u.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = new URL(req.url);
    const pageRaw = Number(url.searchParams.get("page") ?? "1");
    const limitRaw = Number(url.searchParams.get("limit") ?? "20");
    const page =
      Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

    const res = await listSupportThreadsForStaffPaginated(u.id, {
      page,
      limit: parseLimit(limitRaw),
      status:
        url.searchParams.get("status") === "open"
          ? "open"
          : url.searchParams.get("status") === "closed"
            ? "closed"
            : "all",
      urgency:
        url.searchParams.get("urgency") === "urgent"
          ? "urgent"
          : url.searchParams.get("urgency") === "attention"
            ? "attention"
            : "all",
      sort: parseSort(url.searchParams.get("sort")),
      order:
        url.searchParams.get("order") === "asc"
          ? "asc"
          : ("desc" as const),
    });
    return NextResponse.json(res);
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }
}
