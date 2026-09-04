"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/ops";
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        setError("Code invalide");
        setBusy(false);
        return;
      }
      window.location.assign(next);
    } catch {
      setError("Erreur réseau");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <img
          src="/brand/ngemba-logo.png"
          alt="NGEMBA"
          width={88}
          height={88}
          className="size-[88px] rounded-2xl bg-white object-contain p-2 shadow-sm ring-1 ring-[var(--ng-border)]"
        />
        <p className="mt-4 text-[11px] font-semibold tracking-[0.16em] text-ng-primary uppercase">
          NGEMBA OPS
        </p>
        <p className="mt-1 text-xs text-ng-muted">Paix · Sécurité citoyenne</p>
      </div>
      <h1 className="text-xl font-semibold text-ng-text">Connexion</h1>
      <p className="mt-2 text-sm text-ng-muted">
        Accès réservé aux opérateurs et partenaires accrédités.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-xs font-semibold text-ng-muted">
          Code opérateur
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="current-password"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text"
            required
          />
        </label>
        {error ? (
          <p className="text-sm font-medium text-ng-urgent">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy || token.length < 8}
          className="min-h-11 w-full rounded-xl bg-ng-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Connexion..." : "Entrer"}
        </button>
      </form>

      <Link href="/" className="mt-8 text-center text-sm text-ng-muted">
        Retour app citoyenne
      </Link>
    </main>
  );
}

export default function OpsLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-sm px-4 py-20 text-sm text-ng-muted">
          Chargement...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
