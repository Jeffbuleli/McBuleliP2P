"use client";

import {
  mailtoUrl,
  telUrl,
  waMeUrl,
  type TrustedContact,
} from "@/lib/trusted-contacts/types";

type Props = {
  contacts: TrustedContact[];
};

export function OpsTrustedContacts({ contacts }: Props) {
  if (!contacts.length) {
    return (
      <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
          Proches de confiance
        </h2>
        <p className="mt-2 text-sm text-ng-muted">
          Aucun proche enregistre sur cette alerte. Contacter uniquement si
          utile (victime injoignable / suivi dossier) et sans risque agresseur.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ng-muted">
        Proches de confiance
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-ng-muted">
        Ressource dossier - pas d&apos;alerte auto. Utiliser si la victime n&apos;est
        plus joignable, ou pour avancer le dossier. Mode discret : ne pas
        appeler / WhatsApp sans relecture.
      </p>
      <ul className="mt-4 space-y-3">
        {contacts.map((c, i) => {
          const call = telUrl(c.phone);
          const wa = waMeUrl(c.phone);
          const mail = mailtoUrl(c.email);
          return (
            <li
              key={`${c.name}-${i}`}
              className="rounded-xl border border-[var(--ng-border)] bg-ng-primary-muted/30 px-3 py-3"
            >
              <p className="text-sm font-semibold text-ng-text">
                {c.name}
                {c.relation ? (
                  <span className="font-normal text-ng-muted">
                    {" "}
                    · {c.relation}
                  </span>
                ) : null}
              </p>
              {c.phone ? (
                <p className="mt-1 font-mono text-xs text-ng-muted">{c.phone}</p>
              ) : null}
              {c.email ? (
                <p className="mt-0.5 text-xs text-ng-muted">{c.email}</p>
              ) : null}
              {c.address ? (
                <p className="mt-1 text-xs text-ng-text">{c.address}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {call ? (
                  <a
                    href={call}
                    className="rounded-lg bg-ng-primary px-3 py-1.5 text-[11px] font-semibold text-white"
                  >
                    Appeler
                  </a>
                ) : null}
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-ng-secondary px-3 py-1.5 text-[11px] font-semibold text-white"
                  >
                    WhatsApp
                  </a>
                ) : null}
                {mail ? (
                  <a
                    href={mail}
                    className="rounded-lg border border-[var(--ng-border)] px-3 py-1.5 text-[11px] font-semibold text-ng-primary"
                  >
                    Email
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
