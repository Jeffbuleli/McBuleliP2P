import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

function Tile({
  label,
  href,
  accent = "primary",
}: {
  label: string;
  href: "/sos" | "/witness" | "/discrete" | "/school" | "/jeunesse";
  accent?: "primary" | "secondary";
}) {
  const bg = accent === "secondary" ? colors.secondaryMuted : colors.primaryMuted;
  const fg = accent === "secondary" ? colors.secondary : colors.primary;
  return (
    <Link href={href} asChild>
      <Pressable
        onPress={() => void hapticTap()}
        style={({ pressed }) => [
          styles.tile,
          pressed && { opacity: 0.88 },
        ]}
      >
        <View style={[styles.tileIcon, { backgroundColor: bg }]}>
          <Text style={[styles.tileIconText, { color: fg }]}>●</Text>
        </View>
        <Text style={styles.tileLabel}>{label}</Text>
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
          <Text style={styles.powered}>{t.powered}</Text>
        </View>

        <View style={styles.langRow}>
          {locales.map((code) => (
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

        <View style={[styles.grid, { marginTop: 28 }]}>
          <Tile label={t.sos} href="/sos" />
          <Tile label={t.witness} href="/witness" accent="secondary" />
        </View>
        <View style={styles.grid}>
          <Tile label={t.school} href="/school" accent="secondary" />
          <Tile label={t.youth} href="/jeunesse" />
        </View>

        <Link href="/sos" asChild>
          <Pressable
            onPress={() => void hapticTap()}
            style={({ pressed }) => [
              styles.sosBtn,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.sosBtnTitle}>{t.sos}</Text>
            <Text style={styles.sosBtnHint}>{t.sosHint}</Text>
          </Pressable>
        </Link>

        <Text style={styles.line}>{t.line}</Text>

        <Link href="/discrete" asChild>
          <Pressable style={styles.discreteLink}>
            <Text style={styles.discreteLinkText}>{t.discrete}</Text>
          </Pressable>
        </Link>
        <Text style={styles.discreteHint}>{t.discreteTap}</Text>
        <Text style={styles.discreteHint}>{t.discreteShake}</Text>

        <Link href="/trusted-contacts" asChild>
          <Pressable style={styles.trustedLink}>
            <Text style={styles.trustedLinkText}>{t.trustedContactsLink}</Text>
          </Pressable>
        </Link>
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
    alignItems: "center",
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
  powered: { fontSize: 11, fontWeight: "600", color: colors.primary },
  langRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langBtnText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  langBtnTextActive: { color: "#fff" },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconText: { fontSize: 16, fontWeight: "700" },
  tileLabel: { marginTop: 10, fontSize: 14, fontWeight: "600", color: colors.text },
  sosBtn: {
    alignSelf: "center",
    marginTop: 28,
    width: 112,
    height: 112,
    borderRadius: 999,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.urgent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  sosBtnTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sosBtnHint: { color: "rgba(255,255,255,0.9)", fontSize: 10, marginTop: 4 },
  line: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    lineHeight: 20,
  },
  discreteLink: { alignSelf: "center", marginTop: 20 },
  discreteLinkText: {
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
  trustedLink: { alignSelf: "center", marginTop: 20 },
  trustedLinkText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
