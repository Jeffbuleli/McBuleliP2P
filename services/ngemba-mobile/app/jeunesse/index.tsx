import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocale } from "../../src/context/locale";
import { messages } from "../../src/lib/i18n";
import { YOUTH_SCENARIOS } from "../../src/lib/youth-scenarios";
import { colors } from "../../src/theme/colors";

export default function JeunesseScreen() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = messages[locale];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t.back}</Text>
        </Pressable>
        <Text style={styles.title}>{t.youthTitle}</Text>
        <Text style={styles.sub}>{t.youthSubtitle}</Text>
        <Text style={styles.disclaimer}>{t.youthDisclaimer}</Text>

        {YOUTH_SCENARIOS.map((scenario, index) => (
          <Link
            key={scenario.id}
            href={`/jeunesse/${scenario.id}`}
            asChild
          >
            <Pressable style={styles.card}>
              <Text style={styles.num}>
                {index + 1}/10
              </Text>
              <Text style={styles.cardTitle}>{scenario.title[locale]}</Text>
              <Text style={styles.cardIntro} numberOfLines={2}>
                {scenario.intro[locale]}
              </Text>
            </Pressable>
          </Link>
        ))}
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
  disclaimer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.secondaryMuted,
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  num: { fontSize: 11, fontWeight: "700", color: colors.muted },
  cardTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  cardIntro: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
});
