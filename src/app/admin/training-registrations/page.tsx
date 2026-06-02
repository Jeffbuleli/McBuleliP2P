"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type Row = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  locale: string;
  experienceLevel: string | null;
  interests: string[] | null;
  whatsappOptIn: boolean;
  utmCampaign: string | null;
  createdAt: string;
};

export default function AdminTrainingRegistrationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(
      `/api/admin/training-registrations?page=${page}&limit=50`,
      { credentials: "include", cache: "no-store" },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof j.error === "string" ? j.error : "Forbidden");
      setRows([]);
      return;
    }
    setRows((j.registrations as Row[]) ?? []);
    setTotal(typeof j.total === "number" ? j.total : 0);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  function exportCsv() {
    const header = [
      "createdAt",
      "fullName",
      "email",
      "phone",
      "city",
      "locale",
      "experienceLevel",
      "interests",
      "whatsappOptIn",
      "utmCampaign",
    ];
    const lines = rows.map((r) =>
      [
        r.createdAt,
        r.fullName,
        r.email,
        r.phone,
        r.city ?? "",
        r.locale,
        r.experienceLevel ?? "",
        (r.interests ?? []).join("|"),
        r.whatsappOptIn ? "yes" : "no",
        r.utmCampaign ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mcbuleli-formation-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div>
      <AdminBackLink href="/admin">← Admin</AdminBackLink>
      <AdminPageHeader
        title="Inscriptions formation"
        subtitle="Lancement McBuleli — rappels apprenants (super-admin)"
      />
      {err ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void load()} className={adminCls.btnSecondary}>
          Actualiser
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className={adminCls.btnSecondary}
        >
          Export CSV (page)
        </button>
        <span className="self-center text-sm text-[color:var(--fd-muted)]">
          Total : {total}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/50 text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Tél.</th>
              <th className="px-3 py-2">Intérêts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[color:var(--fd-border)]/60">
                <td className="px-3 py-2 whitespace-nowrap text-xs text-[color:var(--fd-muted)]">
                  {new Date(r.createdAt).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2 font-semibold">{r.fullName}</td>
                <td className="px-3 py-2">
                  <a href={`mailto:${r.email}`} className="text-[color:var(--fd-primary)]">
                    {r.email}
                  </a>
                </td>
                <td className="px-3 py-2">{r.phone}</td>
                <td className="px-3 py-2 text-xs">
                  {(r.interests ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          className={adminCls.btnSecondary}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ←
        </button>
        <span className="self-center text-sm">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          className={adminCls.btnSecondary}
          onClick={() => setPage((p) => p + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
