import AsyncStorage from "@react-native-async-storage/async-storage";
import { isLocale, type Locale } from "./i18n";

const KEY = "ngemba_locale";

export async function readStoredLocale(): Promise<Locale | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw && isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export async function writeStoredLocale(locale: Locale) {
  try {
    await AsyncStorage.setItem(KEY, locale);
  } catch {
    // ignore
  }
}
