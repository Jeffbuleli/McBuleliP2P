"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type U = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<U[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/users");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "Forbidden — super admin only.");
        setUsers([]);
        return;
      }
      setUsers(data.users as U[]);
    })();
  }, []);

  async function setRole(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? "Failed");
      return;
    }
    const data = await res.json();
    setUsers((prev) =>
      prev
        ? prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u))
        : prev,
    );
  }

  if (users === null) {
    return <p className="text-stone-500">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Users &amp; roles</h2>
        <Link href="/admin" className="text-sm text-amber-200 underline">
          Back
        </Link>
      </div>
      {err ? <p className="mb-4 text-rose-400">{err}</p> : null}
      <ul className="space-y-3">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-700 bg-stone-900/60 px-3 py-2"
          >
            <div>
              <p className="text-white">{u.email}</p>
              <p className="text-xs text-stone-500">{u.id}</p>
            </div>
            <select
              value={u.role}
              onChange={(e) => void setRole(u.id, e.target.value)}
              className="rounded-lg border border-stone-600 bg-stone-950 px-2 py-1 text-sm text-stone-200"
            >
              <option value="user">user</option>
              <option value="agent">agent</option>
              <option value="super_admin">super_admin</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
