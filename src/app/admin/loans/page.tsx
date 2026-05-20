import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";
import { adminCls, AdminPageHeader } from "@/components/admin/admin-ui";

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
    headers: {},
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
        <div className={adminCls.card}>
          <p className="text-[color:var(--fd-text)]">{e.message}</p>
        </div>
      );
    }
    throw e;
  }

  const sp = await searchParams;
  const status = (sp.status ?? "open").trim().toLowerCase();
  const data = await fetchAdminLoans(status);

  return (
    <div className={adminCls.page}>
      <AdminPageHeader title={d.admin_loans_title} subtitle={d.admin_loans_sub} />
      <div className="flex flex-wrap gap-2">
        {["open", "repaid", "defaulted", "all"].map((s) => (
          <Link
            key={s}
            href={`/admin/loans?status=${s}`}
            className={
              status === s
                ? adminCls.btnPrimary
                : adminCls.btnSecondary
            }
          >
            {s.toUpperCase()}
          </Link>
        ))}
      </div>

      <div className="fd-card overflow-hidden rounded-2xl">
        <div className={`grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1fr] gap-3 border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${adminCls.muted}`}>
          <span>{d.admin_loans_col_user}</span>
          <span className="text-right">{d.admin_loans_col_principal}</span>
          <span className="text-right">{d.admin_loans_col_outstanding}</span>
          <span className="text-right">{d.admin_loans_col_status}</span>
          <span className="text-right">{d.admin_loans_col_created}</span>
        </div>
        <ul className="divide-y divide-[color:var(--fd-border)]">
          {data.loans.length === 0 ? (
            <li className={adminCls.empty}>{d.admin_loans_empty}</li>
          ) : (
            data.loans.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_1fr] gap-3 px-4 py-3 text-sm text-[color:var(--fd-text)]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.email}</p>
                  <p className={`mt-0.5 truncate text-xs ${adminCls.muted}`}>{r.id}</p>
                </div>
                <p className="text-right tabular-nums">{Number(r.principalUsdt).toFixed(2)}</p>
                <p className="text-right tabular-nums">{Number(r.outstandingUsdt).toFixed(2)}</p>
                <p className="text-right text-xs font-bold uppercase tracking-wide">{r.status}</p>
                <p className={`text-right text-xs ${adminCls.muted}`}>
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
