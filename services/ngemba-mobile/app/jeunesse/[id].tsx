import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { useLocale } from "../../src/context/locale";
import { apiBaseUrl } from "../../src/lib/api";
import { messages } from "../../src/lib/i18n";
import { getYouthScenario } from "../../src/lib/youth-scenarios";
import { colors } from "../../src/theme/colors";

type Turn = { role: "user" | "assistant"; content: string };

export default function JeunesseScenarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const t = messages[locale];
  const scenario = getYouthScenario(id ?? "");
  const [history, setHistory] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestSos, setSuggestSos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (!scenario || booted.current) return;
    booted.current = true;
    setHistory([{ role: "assistant", content: scenario.intro[locale] }]);
  }, [scenario, locale]);

  if (!scenario) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t.youthBackToList}</Text>
        </Pressable>
        <Text style={styles.error}>{t.errorGeneric}</Text>
      </SafeAreaView>
    );
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !scenario) return;
    const nextHistory: Turn[] = [...history, { role: "user", content: text }];
    setHistory(nextHistory);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl()}/api/youth/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          locale,
          history: nextHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setError(t.errorGeneric);
        return;
      }
      setHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.reply as string },
      ]);
      setSuggestSos(Boolean(data.suggestSos));
    } catch {
      setError(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t.youthBackToList}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {scenario.title[locale]}
        </Text>
      </View>

      {suggestSos ? (
        <View style={styles.sosBox}>
          <Text style={styles.sosText}>
            {t.youthSosHint}{" "}
            <Link href="/sos" style={styles.sosLink}>
              SOS
            </Link>
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.chat}>
        {history.map((turn, i) => (
          <View
            key={`${turn.role}-${i}`}
            style={[
              styles.bubble,
              turn.role === "user" ? styles.bubbleUser : styles.bubbleAi,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                turn.role === "user" && styles.bubbleTextUser,
              ]}
            >
              {turn.content}
            </Text>
          </View>
        ))}
        {busy ? <ActivityIndicator color={colors.primary} /> : null}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.composer}>
        <Text style={styles.label}>{t.youthYourTurn}</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t.youthPlaceholder}
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
        />
        <Pressable
          disabled={!input.trim() || busy}
          onPress={() => void send()}
          style={[styles.btn, { opacity: !input.trim() || busy ? 0.5 : 1 }]}
        >
          <Text style={styles.btnText}>{t.youthSend}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
  },
  back: { fontSize: 14, fontWeight: "600", color: colors.muted },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  sosBox: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
  },
  sosText: { fontSize: 12, fontWeight: "600", color: colors.urgent },
  sosLink: { textDecorationLine: "underline", fontWeight: "800" },
  chat: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "90%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  bubbleAi: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: 14, lineHeight: 20, color: colors.text },
  bubbleTextUser: { color: "#fff" },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted },
  input: {
    marginTop: 8,
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: "top",
  },
  btn: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  error: {
    marginHorizontal: 20,
    marginBottom: 8,
    color: colors.urgent,
    fontWeight: "600",
    fontSize: 13,
  },
});
