"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Login failed");
        return;
      }
      router.push("/app");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Welcome back</h1>
      <p className="mt-1 text-sm text-stone-600">Sign in to continue.</p>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-800">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none ring-emerald-700 focus:ring-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-stone-800">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base outline-none ring-emerald-700 focus:ring-2"
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-emerald-700 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-600">
        No account?{" "}
        <Link href="/register" className="font-semibold text-emerald-800 underline">
          Register
        </Link>
      </p>
    </div>
  );
}
