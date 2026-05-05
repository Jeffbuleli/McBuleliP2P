import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

type LoanRow = {
  id: string;
  userId: string;
  email: string;
  principalUsdt: string;
  outstandingUsdt: string;
  status: string;
  aprAnnual: string;
  createdAt: string;
  updatedAt: string;
};

async function fetchAdminLoans(status: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/admin/loans?status=${status}`, {
    cache: "no-store",
    headers: {
      // For same-origin server fetch in Next, relative should work; keep absolute when env exists.
    },
  }).catch(() => null);
  if (!res) return { loans: [] as LoanRow[] };
  const j = await res.json().catch(() => ({ loans: [] }));
  return j as { loans: LoanRow[] };
}

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const locale = await getLocale();
  const d = getDictionary(locale);

  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 text-stone-200">
          {e.message}
        </div>
      );
    }
    throw e;
  }

  const sp = await searchParams;
  const status = (sp.status ?? "open").trim().toLowerCase();
  const data = await fetchAdminLoans(status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{d.admin_loans_title}</h2>
          <p className="mt-1 text-sm text-stone-500">{d.admin_loans_sub}</p>
        </div>
        <div className="flex gap-2">
          {["open", "repaid", "defaulted", "all"].map((s) => (
            <Link
              key={s}
              href={`/admin/loans?status=${s}`}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === s
                  ? "bg-amber-600 text-stone-950"
                  : "border border-stone-700 bg-stone-900/60 text-stone-200 hover:border-amber-700/40"
              }`}
            >
              {s.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-800">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1fr] gap-3 border-b border-stone-800 bg-stone-900/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
          <span>{d.admin_loans_col_user}</span>
          <span className="text-right">{d.admin_loans_col_principal}</span>
          <span className="text-right">{d.admin_loans_col_outstanding}</span>
          <span className="text-right">{d.admin_loans_col_status}</span>
          <span className="text-right">{d.admin_loans_col_created}</span>
        </div>
        <ul className="divide-y divide-stone-800 bg-stone-950/40">
          {data.loans.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-stone-500">{d.admin_loans_empty}</li>
          ) : (
            data.loans.map((r) => (
              <li key={r.id} className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1fr] gap-3 px-4 py-3 text-sm text-stone-200">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-stone-100">{r.email}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-500">{r.id}</p>
                </div>
                <p className="text-right tabular-nums">{Number(r.principalUsdt).toFixed(2)}</p>
                <p className="text-right tabular-nums">{Number(r.outstandingUsdt).toFixed(2)}</p>
                <p className="text-right text-xs font-bold uppercase tracking-wide">{r.status}</p>
                <p className="text-right text-xs text-stone-400">
                  {new Date(r.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

