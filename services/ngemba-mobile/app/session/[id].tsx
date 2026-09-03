import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocale } from "../../src/context/locale";
import { fetchSession } from "../../src/lib/api";
import { messages, urgencyLabel } from "../../src/lib/i18n";
import { colors } from "../../src/theme/colors";

export default function SessionScreen() {
  const router = useRouter();
  const { id, discrete } = useLocalSearchParams<{ id: string; discrete?: string }>();
  const { locale } = useLocale();
  const t = messages[locale];
  const isDiscrete = discrete === "1";
  const theme = isDiscrete ? discreteTheme : lightTheme;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState("");
  const [urgency, setUrgency] = useState("");
  const [place, setPlace] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void fetchSession(id)
      .then((session) => {
        setSummary(
          session.aiPayload?.summary_user_locale || session.aiSummary || "",
        );
        setUrgency(session.urgency);
        setPlace(session.locationLabel || session.commune);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.replace("/")}>
          <Text style={[styles.back, { color: theme.muted }]}>{t.home}</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.accent} />
        ) : error ? (
          <Text style={[styles.error, { color: colors.urgent }]}>
            {t.errorGeneric}
          </Text>
        ) : (
          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.accent }]}>
              {t.alertOk}
            </Text>
            <Text style={[styles.sub, { color: theme.muted }]}>
              {t.humanSoon}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: theme.badgeBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.accent }]}>
                {t.urgency} - {urgencyLabel(locale, urgency)}
              </Text>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.summary, { color: theme.text }]}>
                {summary}
              </Text>
              {place ? (
                <Text style={[styles.place, { color: theme.muted }]}>
                  {place}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.hint, { color: theme.muted }]}>
              {t.emergencyHint}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const lightTheme = {
  bg: colors.bg,
  accent: colors.primary,
  muted: colors.muted,
  text: colors.text,
  card: colors.surface,
  border: colors.border,
  badgeBg: colors.primaryMuted,
};

const discreteTheme = {
  bg: colors.discreteBg,
  accent: "#e8d4e3",
  muted: colors.discreteMuted,
  text: colors.discreteText,
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.1)",
  badgeBg: "rgba(255,255,255,0.08)",
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  back: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  body: { marginTop: 24 },
  title: { fontSize: 22, fontWeight: "700" },
  sub: { fontSize: 14, marginTop: 6 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  card: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  summary: { fontSize: 15, lineHeight: 22 },
  place: { marginTop: 12, fontSize: 12, fontWeight: "600" },
  hint: { marginTop: 16, fontSize: 12, lineHeight: 18 },
  error: { marginTop: 40, fontSize: 14, fontWeight: "600" },
});
