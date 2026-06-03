"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type EditionRow = {
  id: string;
  slug: string;
  programSlug: string;
  titleFr: string;
  status: string;
  enrollmentCount: number;
};

type EnrollmentRow = {
  id: string;
  email: string;
  displayName: string | null;
  enrolledAt: string;
  paidUsdt: string;
  status: string;
};

export default function AdminAcademyPage() {
  const [editions, setEditions] = useState<EditionRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/academy", { credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr("Forbidden");
      return;
    }
    setEditions((j.editions as EditionRow[]) ?? []);
  }, []);

  const loadEnrollments = useCallback(async (editionSlug: string) => {
    const res = await fetch(
      `/api/admin/academy?edition=${encodeURIComponent(editionSlug)}&limit=100`,
      { credentials: "include" },
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setEnrollments((j.enrollments as EnrollmentRow[]) ?? []);
      setTotal(typeof j.total === "number" ? j.total : 0);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (selected) void loadEnrollments(selected);
  }, [selected, loadEnrollments]);

  function exportCsv() {
    const header = ["enrolledAt", "email", "displayName", "paidUsdt", "status"];
    const lines = enrollments.map((r) =>
      [r.enrolledAt, r.email, r.displayName ?? "", r.paidUsdt, r.status]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `academy-${selected ?? "cohort"}.csv`;
    a.click();
  }

  return (
    <div className={adminCls.page}>
      <AdminBackLink href="/admin">← Admin</AdminBackLink>
      <AdminPageHeader title="McBuleli Academy" subtitle="Cohortes & inscriptions" />
      {err ? <p className="text-sm text-rose-700">{err}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold">Éditions</h2>
          <ul className="mt-2 space-y-1">
            {editions.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelected(e.slug)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selected === e.slug
                      ? "bg-stone-900 text-white"
                      : "bg-stone-50 hover:bg-stone-100"
                  }`}
                >
                  <span className="font-semibold">{e.titleFr}</span>
                  <span className="ml-2 text-xs opacity-80">
                    {e.status} · {e.enrollmentCount} inscrits
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={adminCls.card}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">
              Inscriptions {selected ? `— ${selected}` : ""}
            </h2>
            {selected && enrollments.length > 0 ? (
              <button
                type="button"
                onClick={exportCsv}
                className="text-xs font-bold text-[#305f33]"
              >
                CSV
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-stone-500">{total} total</p>
          {!selected ? (
            <p className="mt-4 text-sm text-stone-500">Sélectionnez une édition</p>
          ) : (
            <div className="mt-2 max-h-[420px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 pr-2">Email</th>
                    <th className="py-1 pr-2">Nom</th>
                    <th className="py-1">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((r) => (
                    <tr key={r.id} className="border-b border-stone-100">
                      <td className="py-1.5 pr-2">{r.email}</td>
                      <td className="py-1.5 pr-2">{r.displayName ?? "—"}</td>
                      <td className="py-1.5 whitespace-nowrap">
                        {new Date(r.enrolledAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
