"use client";

type PartnerHint = {
  id: string;
  name: string;
  contactHint: string | null;
  nationalFallback: boolean;
};

type RoutingMeta = {
  provinceId: string | null;
  provinceName: string | null;
  commune: string | null;
  matchedPartnerIds: string[];
  scope: "local" | "national_fallback" | "unassigned";
  note: string;
};

type ReferralHint = {
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  organizationName: string | null;
  contactHint: string | null;
  score: number;
  reason: string;
  scope: string;
};

type Props = {
  routingMeta: RoutingMeta | null;
  suggestedPartners: PartnerHint[];
  referrals?: {
    requiredServices: string[];
    matches: ReferralHint[];
    unmatched: string[];
  } | null;
};

export function OpsRoutingPanel({
  routingMeta,
  suggestedPartners,
  referrals,
}: Props) {
  const scope = routingMeta?.scope ?? "unassigned";
  const scopeLabel =
    scope === "local"
      ? "Bassin local"
      : scope === "national_fallback"
        ? "Hors zone - fallback national"
        : "Non assigne";

  const scopeClass =
    scope === "local"
      ? "bg-emerald-50 text-emerald-800"
      : scope === "national_fallback"
        ? "bg-amber-50 text-amber-800"
        : "bg-ng-primary-muted text-ng-muted";

  return (
    <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
        Orientation par proximite
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${scopeClass}`}
        >
          {scopeLabel}
        </span>
        {routingMeta?.provinceName ? (
          <span className="text-xs text-ng-muted">
            {routingMeta.commune ? `${routingMeta.commune}, ` : ""}
            {routingMeta.provinceName}
          </span>
        ) : (
          <span className="text-xs text-ng-muted">Lieu non precise</span>
        )}
      </div>
      {routingMeta?.note ? (
        <p className="mt-2 text-xs leading-relaxed text-ng-muted">
          {routingMeta.note}
        </p>
      ) : null}

      {referrals?.requiredServices?.length ? (
        <p className="mt-3 text-[11px] text-ng-muted">
          Services requis : {referrals.requiredServices.join(" - ")}
        </p>
      ) : null}

      {referrals?.matches?.length ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ng-primary">
            Referral
          </p>
          <ul className="mt-2 space-y-2">
            {referrals.matches.map((m) => (
              <li
                key={m.serviceId}
                className="rounded-xl border border-[var(--ng-border)] px-3 py-2 text-sm"
              >
                <p className="font-semibold text-ng-text">{m.serviceName}</p>
                <p className="text-[11px] text-ng-muted">
                  {m.reason} · score {m.score}
                  {m.organizationName ? ` · ${m.organizationName}` : ""}
                </p>
                {m.contactHint ? (
                  <p className="text-xs text-ng-muted">{m.contactHint}</p>
                ) : null}
              </li>
            ))}
          </ul>
          {referrals.unmatched?.length ? (
            <p className="mt-2 text-[11px] text-ng-muted">
              Non couverts : {referrals.unmatched.join(" - ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {suggestedPartners.length ? (
        <ul className="mt-3 space-y-2">
          {suggestedPartners.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[var(--ng-border)] px-3 py-2 text-sm"
            >
              <p className="font-semibold text-ng-text">{p.name}</p>
              {p.contactHint ? (
                <p className="text-xs text-ng-muted">{p.contactHint}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !referrals?.matches?.length ? (
        <p className="mt-3 text-sm text-ng-muted">
          Aucun partenaire annuaire pour ce bassin.
        </p>
      ) : null}
    </article>
  );
}
