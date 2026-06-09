"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Report = {
  id: string;
  reporterId: string;
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: string;
};

type Hidden = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  hiddenReason: string | null;
  createdAt: string;
};

export default function AdminCommunityDmPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [hidden, setHidden] = useState<Hidden[]>([]);

  useEffect(() => {
    fetch("/api/admin/community/dm")
      .then((r) => r.json())
      .then((d: { reports?: Report[]; hidden?: Hidden[] }) => {
        setReports(d.reports ?? []);
        setHidden(d.hidden ?? []);
      });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm text-[#305f33]">
        ← Admin
      </Link>
      <h1 className="mt-2 text-xl font-bold">Community DM moderation</h1>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
          Reports
        </h2>
        <ul className="mt-2 space-y-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-stone-200 bg-white p-3 text-sm"
            >
              <p className="font-semibold">{r.reason}</p>
              <p className="text-xs text-stone-500">
                thread {r.targetId} · {new Date(r.createdAt).toLocaleString()}
              </p>
              {r.details ? (
                <p className="mt-1 text-stone-600">{r.details}</p>
              ) : null}
            </li>
          ))}
          {reports.length === 0 ? (
            <li className="text-sm text-stone-500">No reports.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
          Auto-hidden (anti-scam)
        </h2>
        <ul className="mt-2 space-y-2">
          {hidden.map((h) => (
            <li
              key={h.id}
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"
            >
              <p className="font-mono text-xs text-amber-800">{h.hiddenReason}</p>
              <p className="mt-1">{h.body}</p>
              <p className="mt-1 text-xs text-stone-500">
                {new Date(h.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
          {hidden.length === 0 ? (
            <li className="text-sm text-stone-500">No hidden messages.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
