import AsyncStorage from "@react-native-async-storage/async-storage";

export type TrustedContact = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  relation?: string;
};

const KEY = "ngemba_trusted_contacts";
const SKIPPED_KEY = "ngemba_trusted_contacts_skipped";
export const MAX_TRUSTED_CONTACTS = 3;

export async function readTrustedContacts(): Promise<TrustedContact[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c): c is TrustedContact =>
          !!c &&
          typeof c === "object" &&
          typeof (c as TrustedContact).name === "string" &&
          typeof (c as TrustedContact).phone === "string",
      )
      .slice(0, MAX_TRUSTED_CONTACTS);
  } catch {
    return [];
  }
}

export async function writeTrustedContacts(
  contacts: TrustedContact[],
): Promise<void> {
  const trimmed = contacts.slice(0, MAX_TRUSTED_CONTACTS);
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
}

export async function readTrustedContactsSkipped(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SKIPPED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function writeTrustedContactsSkipped(skipped: boolean) {
  try {
    await AsyncStorage.setItem(SKIPPED_KEY, skipped ? "1" : "0");
  } catch {
    // ignore
  }
}

export function needsTrustedContactsOnboarding(
  contacts: TrustedContact[],
  skipped: boolean,
): boolean {
  return contacts.length === 0 && !skipped;
}
