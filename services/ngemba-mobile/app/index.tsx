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
import { colors } from "../src/theme/colors";

const logoSource = require("../assets/ngemba-logo.png");

function IconAction({
  label,
  href,
  icon,
}: {
  label: string;
  href: "/witness" | "/school" | "/jeunesse";
  icon: ReactNode;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        onPress={() => void hapticTap()}
        style={({ pressed }) => [
          styles.iconAction,
          pressed && { opacity: 0.88 },
        ]}
      >
        <View style={styles.iconBubble}>{icon}</View>
        <Text style={styles.iconLabel}>{label}</Text>
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
          <View style={styles.brandRow}>
            <Pressable
              onPress={onLogoTap}
              accessibilityLabel={t.discrete}
              style={styles.logoWrap}
            >
              <Image
                source={logoSource}
                style={styles.logo}
                resizeMode="contain"
              />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.brand}>Ngemba RDC</Text>
              <Text style={styles.tagline}>{t.tagline}</Text>
            </View>
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
            icon={<IconEye size={20} color={colors.primary} />}
          />
          <IconAction
            label={t.school}
            href="/school"
            icon={<IconGraduation size={20} color={colors.primary} />}
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
    marginTop: 8,
    gap: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,35,70,0.18)",
    padding: 8,
    shadowColor: "#0b1020",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logo: { width: "100%", height: "100%" },
  headerText: { flex: 1 },
  brand: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: colors.primary,
    textTransform: "uppercase",
  },
  tagline: { fontSize: 14, color: colors.muted, marginTop: 2 },
  langWrap: { gap: 4 },
  langHint: { fontSize: 10, color: colors.muted },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
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
    width: 132,
    height: 132,
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
    backgroundColor: colors.primaryMuted,
  },
  iconLabel: { fontSize: 12, fontWeight: "600", color: colors.primary },
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
