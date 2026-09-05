"use client";

type UnitMatchRow = {
  id: string;
  name: string;
  unitType: string;
  status: string;
  organizationName: string | null;
  locationLabel: string | null;
  capabilities: string[];
  score: number;
  reason: string;
  matchedCapabilities: string[];
  etaMinutes: number | null;
};

type Props = {
  matches: UnitMatchRow[];
  sessionId: string;
  canAssign?: boolean;
  onAssigned?: () => void;
};

export function OpsUnitsPanel({
  matches,
  sessionId,
  canAssign = false,
  onAssigned,
}: Props) {
  async function softAssign(unitId: string) {
    const res = await fetch("/api/ops/units", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: unitId,
        softAssignSessionId: sessionId,
      }),
    });
    if (res.ok) onAssigned?.();
  }

  return (
    <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
        Unites disponibles
      </h2>
      <p className="mt-1 text-[11px] text-ng-muted">
        Suggestion Phase 5 - pas de dispatch automatique
      </p>
      {matches.length ? (
        <ul className="mt-3 space-y-2">
          {matches.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-[var(--ng-border)] px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ng-text">{m.name}</p>
                  <p className="text-[11px] text-ng-muted">
                    {m.unitType} · {m.status}
                    {m.organizationName ? ` · ${m.organizationName}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-ng-muted">{m.reason}</p>
                  {m.locationLabel ? (
                    <p className="text-[11px] text-ng-muted">{m.locationLabel}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-ng-primary">
                    score {m.score}
                  </p>
                  {canAssign ? (
                    <button
                      type="button"
                      onClick={() => void softAssign(m.id)}
                      className="mt-1 text-[11px] font-semibold text-ng-secondary underline"
                    >
                      Soft-assign
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ng-muted">
          Aucune unite AVAILABLE compatible pour ce dossier.
        </p>
      )}
    </article>
  );
}
