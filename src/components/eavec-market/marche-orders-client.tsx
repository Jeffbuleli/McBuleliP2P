"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { MarcheChrome } from "@/components/eavec-market/marche-chrome";
import type { EavecMarketOrderRow } from "@/lib/eavec-market/orders";

const STATUS_FR: Record<string, string> = {
  awaiting_payment: "En attente MoMo",
  escrowed: "Payée (sécurisée)",
  ready: "Prête / en remise",
  released: "Terminée",
  cancelled: "Annulée",
  disputed: "Litige",
  expired: "Expirée",
};

const STATUS_EN: Record<string, string> = {
  awaiting_payment: "Awaiting MoMo",
  escrowed: "Paid (secured)",
  ready: "Ready / handover",
  released: "Completed",
  cancelled: "Cancelled",
  disputed: "Dispute",
  expired: "Expired",
};

export function EavecMarcheOrdersClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [orders, setOrders] = useState<EavecMarketOrderRow[] | null>(null);

  useEffect(() => {
    void fetch("/api/eavec/market/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setOrders((d.orders ?? []) as EavecMarketOrderRow[]))
      .catch(() => setOrders([]));
  }, []);

  const label = fr ? STATUS_FR : STATUS_EN;

  return (
    <div className="space-y-4 pb-10">
      <MarcheChrome fr={fr} title={fr ? "Mes commandes" : "My orders"} />

      {orders === null ? (
        <p className="text-center text-sm text-[color:var(--mk-muted)]">…</p>
      ) : orders.length === 0 ? (
        <div className="mk-empty">
          <p style={{ fontFamily: "var(--mk-display)" }} className="text-lg font-extrabold">
            {fr ? "Aucune commande." : "No orders yet."}
          </p>
          <Link href="/app/marche" className="mk-btn-primary max-w-[12rem]">
            {fr ? "Explorer" : "Browse"}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/app/marche/orders/${o.id}`}
                className="mk-panel block active:scale-[0.99]"
              >
                <div className="mk-panel-pad flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-bold text-[color:var(--mk-ink)]"
                      style={{ fontFamily: "var(--mk-display)" }}
                    >
                      {o.listingTitle}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--mk-muted)]">
                      {o.role === "buyer"
                        ? fr
                          ? "Achat"
                          : "Buy"
                        : fr
                          ? "Vente"
                          : "Sale"}
                      {" · "}
                      {label[o.status] ?? o.status}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-extrabold tabular-nums">
                    {`${Math.round(Number(o.totalAmount)).toLocaleString(fr ? "fr-FR" : "en-US")} Fc`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EavecMarcheOrderDetailClient({ id }: { id: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [order, setOrder] = useState<EavecMarketOrderRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [stars, setStars] = useState(5);
  const [rateComment, setRateComment] = useState("");

  async function load() {
    const res = await fetch(`/api/eavec/market/orders/${id}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "not_found");
      return;
    }
    setOrder(data.order as EavecMarketOrderRow);
  }

  useEffect(() => {
    void load();
  }, [id]);

  // Poll while waiting for MoMo confirmation callback.
  useEffect(() => {
    if (!order || order.status !== "awaiting_payment") return;
    const t = window.setInterval(() => {
      void load();
    }, 4000);
    return () => window.clearInterval(t);
  }, [order?.status, id]);

  async function act(
    action:
      | "mark_ready"
      | "confirm"
      | "cancel"
      | "dispute"
      | "resolve_refund"
      | "resolve_release",
  ) {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/eavec/market/orders/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reason: action === "dispute" ? disputeReason || undefined : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "error");
      return;
    }
    await load();
    if (action === "confirm") router.refresh();
  }

  async function submitRating() {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/eavec/market/orders/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars, comment: rateComment || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error ?? "error");
      return;
    }
    await load();
  }

  if (err && !order) {
    return (
      <div>
        <MarcheChrome fr={fr} title={fr ? "Commande" : "Order"} showSell={false} />
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      </div>
    );
  }
  if (!order) {
    return (
      <div>
        <MarcheChrome fr={fr} title={fr ? "Commande" : "Order"} showSell={false} />
        <p className="mt-8 text-center text-sm text-[color:var(--mk-muted)]">…</p>
      </div>
    );
  }

  const label = fr ? STATUS_FR : STATUS_EN;
  const price =
    `${Math.round(Number(order.totalAmount)).toLocaleString(fr ? "fr-FR" : "en-US")} Fc`;

  return (
    <div className="space-y-4 pb-10">
      <MarcheChrome fr={fr} title={fr ? "Commande" : "Order"} showSell={false} />

      <div className="mk-panel">
        <div className="mk-panel-pad space-y-2">
        <p className="mk-section-label">
          {label[order.status] ?? order.status}
        </p>
        <h1
          className="text-xl font-extrabold text-[color:var(--mk-ink)]"
          style={{ fontFamily: "var(--mk-display)" }}
        >
          {order.listingTitle}
        </h1>
        <p className="text-2xl font-black tabular-nums">{price}</p>
        <p className="text-xs text-[color:var(--fd-muted)]">
          {fr ? "Qté" : "Qty"} {order.quantity}
          {" · "}
          {order.role === "buyer" ? (fr ? "Vous achetez" : "You buy") : fr ? "Vous vendez" : "You sell"}
          {order.paymentMethod === "momo" ? " · Mobile Money" : ""}
        </p>
        {order.role === "buyer" ? (
          <Link
            href={`/app/marche/seller/${order.sellerUserId}`}
            className="inline-block text-xs font-bold text-[#0F2D2F] underline"
          >
            {fr ? "Voir le vendeur" : "View seller"}
          </Link>
        ) : null}
        {order.status === "awaiting_payment" ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            {fr
              ? "Validez le paiement sur votre téléphone. Cette page se met à jour automatiquement."
              : "Approve the payment on your phone. This page updates automatically."}
            {order.momoPhone ? (
              <p className="mt-1 font-semibold tabular-nums">{order.momoPhone}</p>
            ) : null}
          </div>
        ) : order.status === "disputed" ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950">
            <p className="font-bold">{fr ? "Litige ouvert" : "Dispute open"}</p>
            {order.disputeReason ? <p className="mt-1">{order.disputeReason}</p> : null}
            <p className="mt-2 text-[color:var(--fd-muted)]">
              {fr
                ? "Accord : rembourser l’acheteur ou libérer au vendeur."
                : "Settle: refund buyer or release to seller."}
            </p>
          </div>
        ) : (
          <ol className="mt-3 space-y-1 text-xs text-[color:var(--mk-muted)]">
            <li className={order.status !== "cancelled" ? "font-bold text-[color:var(--mk-ink)]" : ""}>
              1. {fr ? "Payée (fonds sécurisés)" : "Paid (funds secured)"}
            </li>
            <li
              className={
                order.status === "ready" || order.status === "released"
                  ? "font-bold text-[color:var(--mk-ink)]"
                  : ""
              }
            >
              2. {fr ? "Remise / livraison" : "Handover / delivery"}
            </li>
            <li className={order.status === "released" ? "font-bold text-[color:var(--mk-ink)]" : ""}>
              3. {fr ? "Confirmée → vendeur payé" : "Confirmed → seller paid"}
            </li>
          </ol>
        )}
        </div>
      </div>

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      {order.canRate ? (
        <div className="mk-panel">
          <div className="mk-panel-pad space-y-2">
          <p className="text-sm font-bold text-[color:var(--mk-ink)]">
            {fr ? "Noter le vendeur" : "Rate the seller"}
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className={`min-h-10 min-w-10 rounded-lg text-lg ${
                  n <= stars
                    ? "bg-[color:var(--mk-ink)] text-[#f4f7f6]"
                    : "border border-[color:var(--mk-line)]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <input
            value={rateComment}
            onChange={(e) => setRateComment(e.target.value)}
            placeholder={fr ? "Commentaire (optionnel)" : "Comment (optional)"}
            className="min-h-11 w-full rounded-xl border border-[color:var(--mk-line)] bg-white px-3 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitRating()}
            className="mk-btn-primary"
          >
            {fr ? "Envoyer la note" : "Submit rating"}
          </button>
          </div>
        </div>
      ) : null}

      {order.myRatingStars != null ? (
        <p className="text-center text-xs text-[color:var(--fd-muted)]">
          {fr ? "Votre note" : "Your rating"}: ★ {order.myRatingStars}
        </p>
      ) : null}

      <div className="space-y-2">
        {order.role === "seller" && order.status === "escrowed" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("mark_ready")}
            className="mk-btn-primary"
          >
            {fr ? "Marquer prêt / remis" : "Mark ready / handed over"}
          </button>
        ) : null}

        {order.role === "buyer" &&
        (order.status === "escrowed" || order.status === "ready") ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("confirm")}
            className="mk-btn-primary"
          >
            {fr ? "Confirmer réception" : "Confirm received"}
          </button>
        ) : null}

        {order.status === "escrowed" || order.status === "awaiting_payment" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("cancel")}
            className="flex min-h-12 w-full items-center justify-center rounded-full border border-[color:var(--mk-line)] text-sm font-bold disabled:opacity-60"
          >
            {fr ? "Annuler" : "Cancel"}
          </button>
        ) : null}

        {order.status === "escrowed" || order.status === "ready" ? (
          <div className="space-y-2 pt-2">
            <input
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder={fr ? "Motif du litige (optionnel)" : "Dispute reason (optional)"}
              className="min-h-11 w-full rounded-xl border border-[color:var(--mk-line)] bg-white px-3 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void act("dispute")}
              className="flex min-h-11 w-full items-center justify-center rounded-xl text-xs font-bold text-rose-700 disabled:opacity-60"
            >
              {fr ? "Ouvrir un litige" : "Open dispute"}
            </button>
          </div>
        ) : null}

        {order.status === "disputed" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void act("resolve_refund")}
              className="flex min-h-12 w-full items-center justify-center rounded-full border border-[color:var(--mk-line)] text-sm font-bold disabled:opacity-60"
            >
              {fr ? "Rembourser l’acheteur" : "Refund buyer"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void act("resolve_release")}
              className="mk-btn-primary"
            >
              {fr ? "Libérer au vendeur" : "Release to seller"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
