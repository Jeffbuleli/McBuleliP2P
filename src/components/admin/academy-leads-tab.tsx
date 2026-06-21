"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

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

export function AcademyLeadsTab() {
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
    const header = ["createdAt", "fullName", "email", "phone", "city", "locale"];
    const lines = rows.map((r) =>
      [r.createdAt, r.fullName, r.email, r.phone, r.city ?? "", r.locale]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `academy-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className={adminCls.card}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <img src="/academy/event-live.svg" alt="" className="h-10 w-10" />
        <div>
          <p className="text-sm font-black">Inscriptions publiques</p>
          <p className="text-xs text-[color:var(--fd-muted)]">/formation · {total}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => void load()} className={adminCls.btnSecondary}>
            ↻
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className={adminCls.btnSecondary}
          >
            CSV
          </button>
        </div>
      </div>
      {err ? <p className={adminCls.error}>{err}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            <tr>
              <th className="py-2">Date</th>
              <th className="py-2">Nom</th>
              <th className="py-2">Email</th>
              <th className="py-2">Tél.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[color:var(--fd-border)]/60">
                <td className="py-2 text-xs text-[color:var(--fd-muted)]">
                  {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2 font-semibold">{r.fullName}</td>
                <td className="py-2">{r.email}</td>
                <td className="py-2">{r.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          className={adminCls.btnSecondary}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ←
        </button>
        <span className="self-center text-xs">
          {page}/{totalPages}
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
