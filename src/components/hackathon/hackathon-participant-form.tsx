"use client";

import { useState } from "react";

type Props = {
  editionId: string;
  locale: "fr" | "en";
  priceDay1: string;
  priceFull: string;
  registrationOpen: boolean;
};

export function HackathonParticipantForm({
  editionId,
  locale,
  priceDay1,
  priceFull,
  registrationOpen,
}: Props) {
  const isFr = locale === "fr";
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!registrationOpen) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      editionId,
      firstName: String(fd.get("firstName") ?? ""),
      lastName: String(fd.get("lastName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      whatsapp: String(fd.get("whatsapp") ?? "") || undefined,
      city: String(fd.get("city") ?? "") || undefined,
      profession: String(fd.get("profession") ?? "") || undefined,
      company: String(fd.get("company") ?? "") || undefined,
      level: String(fd.get("level") ?? "beginner"),
      projectName: String(fd.get("projectName") ?? "") || undefined,
      projectDescription: String(fd.get("projectDescription") ?? "") || undefined,
      projectCategory: String(fd.get("projectCategory") ?? "") || undefined,
      workMode: String(fd.get("workMode") ?? "solo"),
      ticketPack: String(fd.get("ticketPack") ?? "full"),
      paymentMethod: String(fd.get("paymentMethod") ?? "orange"),
      locale,
    };

    try {
      const res = await fetch("/api/hackathon/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        checkoutUrl?: string;
        reference?: string;
        ticketCode?: string;
      };
      if (!res.ok) {
        if (json.error === "already_registered") {
          setErr(
            isFr
              ? `Déjà inscrit${json.ticketCode ? ` — ticket ${json.ticketCode}` : ""}.`
              : `Already registered${json.ticketCode ? ` — ticket ${json.ticketCode}` : ""}.`,
          );
        } else if (json.error === "usdt_coming_soon") {
          setErr(
            isFr
              ? "Paiement USDT bientôt disponible — choisissez MoMo ou carte."
              : "USDT payment coming soon — choose MoMo or card.",
          );
        } else {
          setErr(
            json.message ||
              (isFr
                ? "Inscription impossible. Vérifiez vos infos et réessayez."
                : "Registration failed. Check your details and try again."),
          );
        }
        return;
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }
      if (json.reference) {
        window.location.href = `/hackathon/payment/${encodeURIComponent(json.reference)}`;
        return;
      }
      setMsg(
        isFr
          ? "Demande envoyée. Validez le paiement sur votre téléphone."
          : "Request sent. Confirm payment on your phone.",
      );
    } catch {
      setErr(isFr ? "Erreur réseau." : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2.5 text-sm text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)]";
  const label = "block text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!registrationOpen ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {isFr
            ? "Inscriptions fermées pour cette édition."
            : "Registration is closed for this edition."}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="hk-first">
            {isFr ? "Prénom" : "First name"}
          </label>
          <input id="hk-first" name="firstName" required className={field} disabled={!registrationOpen} />
        </div>
        <div>
          <label className={label} htmlFor="hk-last">
            {isFr ? "Nom" : "Last name"}
          </label>
          <input id="hk-last" name="lastName" required className={field} disabled={!registrationOpen} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="hk-email">
            Email
          </label>
          <input id="hk-email" name="email" type="email" required className={field} disabled={!registrationOpen} />
        </div>
        <div>
          <label className={label} htmlFor="hk-phone">
            {isFr ? "Téléphone (paiement MoMo)" : "Phone (MoMo payment)"}
          </label>
          <input id="hk-phone" name="phone" required className={field} placeholder="243…" disabled={!registrationOpen} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="hk-wa">
            WhatsApp
          </label>
          <input id="hk-wa" name="whatsapp" className={field} disabled={!registrationOpen} />
        </div>
        <div>
          <label className={label} htmlFor="hk-city">
            {isFr ? "Ville" : "City"}
          </label>
          <input id="hk-city" name="city" className={field} disabled={!registrationOpen} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="hk-job">
            {isFr ? "Profession" : "Profession"}
          </label>
          <input id="hk-job" name="profession" className={field} disabled={!registrationOpen} />
        </div>
        <div>
          <label className={label} htmlFor="hk-co">
            {isFr ? "Entreprise (optionnel)" : "Company (optional)"}
          </label>
          <input id="hk-co" name="company" className={field} disabled={!registrationOpen} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="hk-level">
            {isFr ? "Niveau" : "Level"}
          </label>
          <select id="hk-level" name="level" className={field} defaultValue="beginner" disabled={!registrationOpen}>
            <option value="beginner">{isFr ? "Débutant" : "Beginner"}</option>
            <option value="intermediate">{isFr ? "Intermédiaire" : "Intermediate"}</option>
            <option value="advanced">{isFr ? "Avancé" : "Advanced"}</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="hk-mode">
            {isFr ? "Travail" : "Work mode"}
          </label>
          <select id="hk-mode" name="workMode" className={field} defaultValue="solo" disabled={!registrationOpen}>
            <option value="solo">{isFr ? "Individuel" : "Solo"}</option>
            <option value="team">{isFr ? "Équipe" : "Team"}</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="hk-proj">
          {isFr ? "Nom du projet" : "Project name"}
        </label>
        <input id="hk-proj" name="projectName" className={field} disabled={!registrationOpen} />
      </div>
      <div>
        <label className={label} htmlFor="hk-desc">
          {isFr ? "Description" : "Description"}
        </label>
        <textarea id="hk-desc" name="projectDescription" rows={3} className={field} disabled={!registrationOpen} />
      </div>
      <div>
        <label className={label} htmlFor="hk-cat">
          {isFr ? "Catégorie" : "Category"}
        </label>
        <select id="hk-cat" name="projectCategory" className={field} defaultValue="ai" disabled={!registrationOpen}>
          {["ai", "fintech", "education", "health", "agriculture", "other"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className={label}>{isFr ? "Pack" : "Pack"}</legend>
        <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--fd-text)]">
          <input type="radio" name="ticketPack" value="day1" disabled={!registrationOpen} />
          {isFr ? `1 jour — ${priceDay1} USD` : `1 day — ${priceDay1} USD`}
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[color:var(--fd-text)]">
          <input type="radio" name="ticketPack" value="full" defaultChecked disabled={!registrationOpen} />
          {isFr
            ? `2 jours + Hackathon — ${priceFull} USD`
            : `2 days + Hackathon — ${priceFull} USD`}
        </label>
      </fieldset>

      <div>
        <label className={label} htmlFor="hk-pay">
          {isFr ? "Paiement" : "Payment"}
        </label>
        <select id="hk-pay" name="paymentMethod" className={field} defaultValue="orange" disabled={!registrationOpen}>
          <option value="orange">Orange Money</option>
          <option value="mpesa">M-Pesa</option>
          <option value="airtel">Airtel Money</option>
          <option value="card">{isFr ? "Carte bancaire" : "Bank card"}</option>
          <option value="usdt">USDT ({isFr ? "bientôt" : "soon"})</option>
        </select>
      </div>

      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
      {msg ? <p className="text-sm font-semibold text-[color:var(--fd-primary)]">{msg}</p> : null}

      <button
        type="submit"
        disabled={busy || !registrationOpen}
        className="w-full rounded-2xl bg-[color:var(--fd-primary)] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {busy
          ? isFr
            ? "Envoi…"
            : "Sending…"
          : isFr
            ? "S'inscrire et payer"
            : "Register & pay"}
      </button>
    </form>
  );
}
