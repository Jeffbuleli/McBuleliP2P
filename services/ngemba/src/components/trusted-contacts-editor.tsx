"use client";

import { useEffect, useState } from "react";
import {
  readLocalTrustedContacts,
  writeLocalTrustedContacts,
} from "@/lib/trusted-contacts/client-store";
import {
  MAX_TRUSTED_CONTACTS,
  type TrustedContact,
} from "@/lib/trusted-contacts/types";

function empty(): TrustedContact {
  return {
    name: "",
    phone: "",
    email: "",
    address: "",
    relation: "",
  };
}

type Props = {
  open?: boolean;
  onChange?: (contacts: TrustedContact[]) => void;
};

export function TrustedContactsEditor({ open = false, onChange }: Props) {
  const [expanded, setExpanded] = useState(open);
  const [contacts, setContacts] = useState<TrustedContact[]>([empty()]);

  useEffect(() => {
    const saved = readLocalTrustedContacts();
    if (saved.length) setContacts(saved);
  }, []);

  function persist(next: TrustedContact[]) {
    setContacts(next);
    const valid = next.filter(
      (c) => c.name.trim().length >= 2 && (c.phone?.trim() || c.email?.trim()),
    );
    writeLocalTrustedContacts(valid);
    onChange?.(valid);
  }

  function update(i: number, field: keyof TrustedContact, value: string) {
    const next = contacts.map((c, idx) =>
      idx === i ? { ...c, [field]: value } : c,
    );
    persist(next);
  }

  return (
    <div className="rounded-xl border border-[var(--ng-border)] bg-ng-surface p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-ng-text"
      >
        <span>Proches de confiance (optionnel)</span>
        <span className="text-xs font-normal text-ng-muted">
          {expanded ? "Masquer" : "Ajouter"}
        </span>
      </button>
      <p className="mt-1 text-xs leading-relaxed text-ng-muted">
        Ces infos aident les services si vous n&apos;etes plus joignable. Elles
        ne sont pas diffusees a chaque alerte.
      </p>

      {expanded ? (
        <div className="mt-3 space-y-3">
          {contacts.map((c, i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border border-[var(--ng-border)] p-2"
            >
              <p className="text-[11px] font-semibold text-ng-primary">
                Contact {i + 1}
              </p>
              <input
                value={c.name}
                onChange={(e) => update(i, "name", e.target.value)}
                placeholder="Nom"
                className="min-h-10 w-full rounded-lg border border-[var(--ng-border)] px-2 text-sm"
              />
              <input
                value={c.relation ?? ""}
                onChange={(e) => update(i, "relation", e.target.value)}
                placeholder="Lien (mere, ami, voisin...)"
                className="min-h-10 w-full rounded-lg border border-[var(--ng-border)] px-2 text-sm"
              />
              <input
                value={c.phone ?? ""}
                onChange={(e) => update(i, "phone", e.target.value)}
                placeholder="Telephone (+243...)"
                inputMode="tel"
                className="min-h-10 w-full rounded-lg border border-[var(--ng-border)] px-2 text-sm"
              />
              <input
                value={c.email ?? ""}
                onChange={(e) => update(i, "email", e.target.value)}
                placeholder="Email (optionnel)"
                inputMode="email"
                className="min-h-10 w-full rounded-lg border border-[var(--ng-border)] px-2 text-sm"
              />
              <input
                value={c.address ?? ""}
                onChange={(e) => update(i, "address", e.target.value)}
                placeholder="Adresse / quartier (optionnel)"
                className="min-h-10 w-full rounded-lg border border-[var(--ng-border)] px-2 text-sm"
              />
              {contacts.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    persist(contacts.filter((_, idx) => idx !== i))
                  }
                  className="text-xs font-semibold text-ng-urgent"
                >
                  Retirer
                </button>
              ) : null}
            </div>
          ))}
          {contacts.length < MAX_TRUSTED_CONTACTS ? (
            <button
              type="button"
              onClick={() => persist([...contacts, empty()])}
              className="text-xs font-semibold text-ng-primary underline"
            >
              Ajouter un contact
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
