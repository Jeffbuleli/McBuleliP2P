"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/ops";
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "recover">("login");

  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referent, setReferent] = useState("");
  const [recoverOk, setRecoverOk] = useState(false);
  const [recoverBusy, setRecoverBusy] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const cleaned = token.trim().replace(/\s+/g, "");
    try {
      const res = await fetch("/api/ops/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cleaned }),
      });
      if (res.status === 429) {
        setError("Trop d'essais — réessayez dans une minute.");
        setBusy(false);
        return;
      }
      if (!res.ok) {
        setError("Code invalide — vérifiez le collage (espaces) ou demandez un nouveau code.");
        setBusy(false);
        return;
      }
      window.location.assign(next);
    } catch {
      setError("Erreur réseau");
      setBusy(false);
    }
  }

  async function submitRecover(e: React.FormEvent) {
    e.preventDefault();
    setRecoverBusy(true);
    setRecoverError(null);
    setRecoverOk(false);
    try {
      const res = await fetch("/api/ops/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization: org.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          referent: referent.trim() || undefined,
        }),
      });
      if (res.status === 429) {
        setRecoverError("Trop de demandes — réessayez plus tard.");
        setRecoverBusy(false);
        return;
      }
      if (!res.ok) {
        setRecoverError("Envoi impossible — écrivez à hi@mcbuleli.org.");
        setRecoverBusy(false);
        return;
      }
      setRecoverOk(true);
      setRecoverBusy(false);
    } catch {
      setRecoverError("Erreur réseau");
      setRecoverBusy(false);
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

      {mode === "login" ? (
        <>
          <h1 className="text-xl font-semibold text-ng-text">Connexion</h1>
          <p className="mt-2 text-sm text-ng-muted">
            Accès réservé aux opérateurs et partenaires accrédités. La session
            reste active 14 jours (renouvelée à chaque visite OPS).
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-xs font-semibold text-ng-muted">
              Code opérateur
              <div className="relative mt-1.5">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onPaste={(e) => {
                    const raw = e.clipboardData.getData("text");
                    if (!raw) return;
                    e.preventDefault();
                    setToken(raw.trim().replace(/\s+/g, ""));
                  }}
                  autoComplete="current-password"
                  spellCheck={false}
                  className="min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 pr-20 text-sm text-ng-text"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-ng-primary"
                >
                  {showToken ? "Masquer" : "Voir"}
                </button>
              </div>
            </label>
            {error ? (
              <p className="text-sm font-medium text-ng-urgent">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={busy || token.trim().length < 8}
              className="min-h-11 w-full rounded-xl bg-ng-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Connexion..." : "Entrer"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ng-muted">
            Code perdu ?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("recover");
                setRecoverOk(false);
                setRecoverError(null);
              }}
              className="font-medium text-ng-primary underline-offset-2 hover:underline"
            >
              Demander un nouveau code
            </button>
            <span className="mt-1 block text-xs">
              McBuleli vérifie puis renvoie un code · 24–48 h ouvrables
            </span>
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold text-ng-text">Nouveau code</h1>
          <p className="mt-2 text-sm text-ng-muted">
            Indiquez l&apos;organisation et l&apos;email partenaire enregistré.
            Nous vous renverrons un code après vérification.
          </p>

          {recoverOk ? (
            <div className="mt-8 rounded-xl border border-[var(--ng-border)] bg-ng-surface px-4 py-5 text-sm text-ng-text">
              Demande envoyée. Surveillez{" "}
              <span className="font-medium">{email || "votre boîte mail"}</span>{" "}
              et hi@mcbuleli.org répondra sous 24–48 h ouvrables.
              <button
                type="button"
                onClick={() => setMode("login")}
                className="mt-4 block w-full min-h-11 rounded-xl bg-ng-primary px-4 text-sm font-semibold text-white"
              >
                Retour connexion
              </button>
            </div>
          ) : (
            <form onSubmit={submitRecover} className="mt-8 space-y-3">
              <label className="block text-xs font-semibold text-ng-muted">
                Organisation
                <input
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="ex. Bloc Citoyen Amani"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text"
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-ng-muted">
                Email partenaire
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email enregistré chez McBuleli"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text"
                  required
                />
              </label>
              <label className="block text-xs font-semibold text-ng-muted">
                Téléphone (optionnel)
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text"
                />
              </label>
              <label className="block text-xs font-semibold text-ng-muted">
                Référent (optionnel)
                <input
                  value={referent}
                  onChange={(e) => setReferent(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text"
                />
              </label>
              {recoverError ? (
                <p className="text-sm font-medium text-ng-urgent">{recoverError}</p>
              ) : null}
              <button
                type="submit"
                disabled={recoverBusy || org.trim().length < 2 || !email.includes("@")}
                className="min-h-11 w-full rounded-xl bg-ng-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {recoverBusy ? "Envoi..." : "Envoyer la demande"}
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="min-h-11 w-full rounded-xl border border-[var(--ng-border)] px-4 text-sm font-medium text-ng-muted"
              >
                Annuler
              </button>
            </form>
          )}
        </>
      )}

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
