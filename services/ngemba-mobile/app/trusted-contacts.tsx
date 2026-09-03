import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocale } from "../src/context/locale";
import { messages } from "../src/lib/i18n";
import {
  MAX_TRUSTED_CONTACTS,
  readTrustedContacts,
  writeTrustedContacts,
  writeTrustedContactsSkipped,
  type TrustedContact,
} from "../src/lib/trusted-contacts-prefs";
import { colors } from "../src/theme/colors";

function emptyContact(): TrustedContact {
  return { name: "", phone: "", email: "" };
}

export default function TrustedContactsScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = messages[locale];
  const [contacts, setContacts] = useState<TrustedContact[]>([
    emptyContact(),
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void readTrustedContacts().then((saved) => {
      if (saved.length) setContacts(saved);
    });
  }, []);

  function updateContact(
    index: number,
    field: keyof TrustedContact,
    value: string,
  ) {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function addContact() {
    if (contacts.length >= MAX_TRUSTED_CONTACTS) return;
    setContacts((prev) => [...prev, emptyContact()]);
  }

  function removeContact(index: number) {
    setContacts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyContact()];
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    const valid = contacts.filter(
      (c) => c.name.trim().length >= 2 && c.phone.trim().length >= 8,
    );
    if (!valid.length) {
      setError(t.trustedContactsError);
      setBusy(false);
      return;
    }
    await writeTrustedContacts(valid);
    await writeTrustedContactsSkipped(false);
    setBusy(false);
    router.back();
  }

  async function skip() {
    await writeTrustedContactsSkipped(true);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t.back}</Text>
        </Pressable>

        <Text style={styles.title}>{t.trustedContactsTitle}</Text>
        <Text style={styles.subtitle}>{t.trustedContactsSubtitle}</Text>

        {contacts.map((contact, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardLabel}>
              {t.trustedContactLabel} {index + 1}
            </Text>
            <TextInput
              value={contact.name}
              onChangeText={(v) => updateContact(index, "name", v)}
              placeholder={t.trustedContactName}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <TextInput
              value={contact.phone}
              onChangeText={(v) => updateContact(index, "phone", v)}
              placeholder={t.trustedContactPhone}
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              value={contact.email ?? ""}
              onChangeText={(v) => updateContact(index, "email", v)}
              placeholder={t.trustedContactEmail}
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            {contacts.length > 1 ? (
              <Pressable onPress={() => removeContact(index)}>
                <Text style={styles.remove}>{t.trustedContactRemove}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        {contacts.length < MAX_TRUSTED_CONTACTS ? (
          <Pressable onPress={addContact} style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t.trustedContactAdd}</Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={busy}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.primaryBtn,
            { opacity: busy ? 0.5 : pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={styles.primaryBtnText}>{t.trustedContactsSave}</Text>
        </Pressable>

        <Pressable onPress={() => void skip()} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>{t.trustedContactsSkip}</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  back: { fontSize: 14, fontWeight: "600", color: colors.muted, marginTop: 8 },
  title: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  card: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  input: {
    marginTop: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  remove: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: colors.urgent,
  },
  addBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  primaryBtn: {
    marginTop: 24,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  skipBtn: { marginTop: 12, alignItems: "center" },
  skipBtnText: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  error: {
    marginTop: 12,
    color: colors.urgent,
    fontSize: 13,
    fontWeight: "600",
  },
});
