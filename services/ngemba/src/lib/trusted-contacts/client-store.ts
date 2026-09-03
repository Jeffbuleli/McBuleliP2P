/** Stockage local navigateur - proches envoyes avec l'alerte (pas de notify auto). */

import type { TrustedContact } from "@/lib/trusted-contacts/types";
import { MAX_TRUSTED_CONTACTS } from "@/lib/trusted-contacts/types";

const KEY = "ngemba_trusted_contacts_v1";

export function readLocalTrustedContacts(): TrustedContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c): c is TrustedContact =>
          !!c &&
          typeof c === "object" &&
          typeof (c as TrustedContact).name === "string",
      )
      .slice(0, MAX_TRUSTED_CONTACTS);
  } catch {
    return [];
  }
}

export function writeLocalTrustedContacts(contacts: TrustedContact[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(contacts.slice(0, MAX_TRUSTED_CONTACTS)),
    );
  } catch {
    // ignore quota
  }
}
