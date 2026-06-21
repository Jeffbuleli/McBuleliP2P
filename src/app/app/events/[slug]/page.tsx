"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { EventPublicView } from "@/lib/events/types";

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventPublicView | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    void fetch(`/api/events/${slug}`)
      .then((r) => r.json())
      .then((d) => setEvent(d.event ?? null));
  }, [slug]);

  async function join() {
    const res = await fetch(`/api/events/${slug}/join`, { method: "POST" });
    const d = await res.json();
    if (d.needsPayment) {
      setMsg("Paiement USDT requis — cliquez Payer.");
      return;
    }
    setMsg(d.ok ? "Inscription confirmée." : d.error ?? "Erreur");
  }

  async function pay() {
    const res = await fetch(`/api/events/${slug}/pay`, { method: "POST" });
    const d = await res.json();
    setMsg(d.ok ? "Paiement OK — inscrit." : d.error ?? "Erreur");
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <p className="text-sm text-[color:var(--fd-muted)]">Chargement…</p>
      </div>
    );
  }

  const when = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: event.timezone,
  }).format(new Date(event.startDate));

  return (
    <div className="mx-auto max-w-lg space-y-4 p-6">
      <Link href="/app/academy" className="text-sm text-[color:var(--fd-primary)]">
        ← Academy
      </Link>
      {event.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.coverImage} alt="" className="w-full rounded-2xl object-cover" />
      ) : null}
      <h1 className="text-2xl font-black">{event.title}</h1>
      <p className="text-sm text-[color:var(--fd-muted)]">{when}</p>
      <p className="text-sm">Formateur : {event.trainerName}</p>
      <p className="text-sm">Plateforme : McBuleli Live</p>
      <p className="text-sm font-semibold">
        {event.eventType === "PAID" && event.priceUsdt > 0
          ? `${event.priceUsdt} USDT`
          : "Gratuit"}
      </p>
      <p className="whitespace-pre-wrap text-sm">{event.description}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void join()}
          className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-sm font-bold text-white"
        >
          Participer
        </button>
        {event.eventType === "PAID" ? (
          <button
            type="button"
            onClick={() => void pay()}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
          >
            Payer (USDT)
          </button>
        ) : null}
        <Link
          href={`/app/events/${slug}/live`}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white"
        >
          Rejoindre le Live
        </Link>
        <a
          href={`/api/events/${slug}/calendar?format=ics`}
          className="rounded-xl border px-4 py-2 text-sm font-bold"
        >
          ICS
        </a>
        <a
          href={`/api/events/${slug}/poster?template=square&ext=jpg`}
          className="rounded-xl border px-4 py-2 text-sm font-bold"
        >
          Affiche JPG
        </a>
      </div>
      {msg ? <p className="text-sm text-amber-800">{msg}</p> : null}
    </div>
  );
}
