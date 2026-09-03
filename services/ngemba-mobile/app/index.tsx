import { Link, useRouter } from "expo-router";
import { useEffect, type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  IconEye,
  IconGraduation,
  IconShield,
  IconSpark,
  IconUsers,
} from "../src/components/icons";
import { useLocale } from "../src/context/locale";
import { localeLabels, locales, messages, type Locale } from "../src/lib/i18n";
import { hapticTap } from "../src/lib/haptics";
import { useTripleTap } from "../src/lib/triple-tap";
import {
  needsTrustedContactsOnboarding,
  readTrustedContacts,
  readTrustedContactsSkipped,
} from "../src/lib/trusted-contacts-prefs";
import { brand, colors } from "../src/theme/colors";

function IconAction({
  label,
  href,
  icon,
  accent = "primary",
}: {
  label: string;
  href: "/witness" | "/school" | "/jeunesse";
  icon: ReactNode;
  accent?: "primary" | "secondary";
}) {
  const bg = accent === "secondary" ? colors.secondaryMuted : colors.primaryMuted;
  const fg = accent === "secondary" ? colors.secondary : colors.primary;
  return (
    <Link href={href} asChild>
      <Pressable
        onPress={() => void hapticTap()}
        style={({ pressed }) => [
          styles.iconAction,
          pressed && { opacity: 0.88 },
        ]}
      >
        <View style={[styles.iconBubble, { backgroundColor: bg }]}>{icon}</View>
        <Text style={[styles.iconLabel, { color: fg }]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const t = messages[locale];
  const onLogoTap = useTripleTap(() => router.push("/discrete"));

  useEffect(() => {
    void (async () => {
      const [contacts, skipped] = await Promise.all([
        readTrustedContacts(),
        readTrustedContactsSkipped(),
      ]);
      if (needsTrustedContactsOnboarding(contacts, skipped)) {
        router.push("/trusted-contacts");
      }
    })();
  }, [router]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={onLogoTap} accessibilityLabel={t.discrete}>
            <Image source={{ uri: brand.logoUrl }} style={styles.logo} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.brand}>NGEMBA</Text>
            <Text style={styles.tagline}>{t.tagline}</Text>
          </View>
          <View style={styles.langWrap}>
            <Text style={styles.langHint}>{t.language}</Text>
            <View style={styles.langRow}>
              {locales.map((code: Locale) => (
                <Pressable
                  key={code}
                  onPress={() => setLocale(code)}
                  style={[
                    styles.langBtn,
                    locale === code && styles.langBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.langBtnText,
                      locale === code && styles.langBtnTextActive,
                    ]}
                  >
                    {localeLabels[code]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.aiRow}>
            <IconSpark size={18} color={colors.primary} />
            <Text style={styles.powered}>{t.powered}</Text>
          </View>
          <Text style={styles.line}>{t.line}</Text>

          <Link href="/sos" asChild>
            <Pressable
              onPress={() => void hapticTap()}
              style={({ pressed }) => [
                styles.sosBtn,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
              accessibilityLabel={`${t.sos} - ${t.sosHint}`}
            >
              <IconShield size={22} color="#fff" />
              <Text style={styles.sosBtnTitle}>{t.sos}</Text>
              <Text style={styles.sosBtnHint}>{t.sosHint}</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.actions}>
          <IconAction
            label={t.witness}
            href="/witness"
            accent="secondary"
            icon={<IconEye size={20} color={colors.secondary} />}
          />
          <IconAction
            label={t.school}
            href="/school"
            accent="secondary"
            icon={<IconGraduation size={20} color={colors.secondary} />}
          />
          <IconAction
            label={t.youth}
            href="/jeunesse"
            icon={<IconUsers size={20} color={colors.primary} />}
          />
        </View>

        <View style={styles.footerLinks}>
          <Link href="/discrete" asChild>
            <Pressable>
              <Text style={styles.footerLink}>{t.discrete}</Text>
            </Pressable>
          </Link>
          <Link href="/trusted-contacts" asChild>
            <Pressable>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {t.trustedContactsLink}
              </Text>
            </Pressable>
          </Link>
        </View>
        <Text style={styles.discreteHint}>{t.discreteTap}</Text>
        <Text style={styles.discreteHint}>{t.discreteShake}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  logo: { width: 48, height: 48, borderRadius: 12 },
  headerText: { flex: 1 },
  brand: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.primary,
  },
  tagline: { fontSize: 14, color: colors.muted, marginTop: 2 },
  langWrap: { alignItems: "flex-end", maxWidth: 140 },
  langHint: { fontSize: 10, color: colors.muted, marginBottom: 4 },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langBtnText: { fontSize: 10, fontWeight: "600", color: colors.muted },
  langBtnTextActive: { color: "#fff" },
  hero: { marginTop: 36, alignItems: "center", gap: 12 },
  aiRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  powered: { fontSize: 14, fontWeight: "700", color: colors.primary },
  line: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 20,
    maxWidth: 260,
  },
  sosBtn: {
    marginTop: 12,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.urgent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  sosBtnTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 },
  sosBtnHint: { color: "rgba(255,255,255,0.9)", fontSize: 10, marginTop: 2 },
  actions: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  iconAction: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 8 },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconLabel: { fontSize: 12, fontWeight: "600" },
  footerLinks: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  footerLink: {
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: "underline",
  },
  discreteHint: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    color: colors.muted,
    paddingHorizontal: 16,
  },
});
