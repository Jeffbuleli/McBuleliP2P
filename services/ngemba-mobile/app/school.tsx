import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocale } from "../src/context/locale";
import { createAlert } from "../src/lib/api";
import { hapticSosConfirm } from "../src/lib/haptics";
import { messages } from "../src/lib/i18n";
import { readTrustedContacts } from "../src/lib/trusted-contacts-prefs";
import { colors } from "../src/theme/colors";

const CONCERNS = [
  "harassment",
  "violence",
  "abuse",
  "cyber",
  "other",
] as const;

type Concern = (typeof CONCERNS)[number];

export default function SchoolScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = messages[locale];
  const [concern, setConcern] = useState<Concern | "">("");
  const [establishment, setEstablishment] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const concernLabels: Record<Concern, string> = {
    harassment: t.schoolConcernHarassment,
    violence: t.schoolConcernViolence,
    abuse: t.schoolConcernAbuse,
    cyber: t.schoolConcernCyber,
    other: t.schoolConcernOther,
  };

  async function submit() {
    if (!concern || message.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const trustedContacts = await readTrustedContacts();
      const result = await createAlert({
        message: message.trim(),
        locale,
        source: "school",
        schoolContext: {
          concernType: concern,
          establishmentHint: establishment.trim() || null,
          isMinor: true,
        },
        trustedContacts: trustedContacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email ?? null,
          address: c.address ?? null,
          relation: c.relation ?? null,
        })),
      });
      await hapticSosConfirm();
      router.replace({ pathname: "/session/[id]", params: { id: result.id } });
    } catch {
      setError(t.errorGeneric);
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t.back}</Text>
        </Pressable>
        <Text style={styles.title}>{t.schoolTitle}</Text>
        <Text style={styles.sub}>{t.schoolSafety}</Text>
        <Text style={styles.hint}>{t.schoolAnonymousNote}</Text>

        <Text style={styles.label}>{t.schoolConcernPick}</Text>
        {CONCERNS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setConcern(c)}
            style={[styles.chip, concern === c && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, concern === c && styles.chipTextActive]}
            >
              {concernLabels[c]}
            </Text>
          </Pressable>
        ))}

        <TextInput
          value={establishment}
          onChangeText={setEstablishment}
          placeholder={t.schoolEstablishmentPlaceholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <Text style={styles.label}>{t.schoolTell}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t.placeholder}
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.area]}
        />
        <Pressable
          disabled={!concern || message.trim().length < 3 || busy}
          onPress={() => void submit()}
          style={[
            styles.btn,
            {
              opacity:
                !concern || message.trim().length < 3 || busy ? 0.5 : 1,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{t.send}</Text>
          )}
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
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  sub: { marginTop: 8, fontSize: 13, lineHeight: 18, color: colors.muted },
  hint: { marginTop: 6, fontSize: 12, color: colors.muted },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  chip: {
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.text },
  chipTextActive: { color: "#fff" },
  input: {
    marginTop: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  area: { minHeight: 120, textAlignVertical: "top" },
  btn: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  error: {
    marginTop: 12,
    color: colors.urgent,
    fontSize: 13,
    fontWeight: "600",
  },
});
