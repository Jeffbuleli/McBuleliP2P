import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { useLocale } from "../context/locale";
import {
  createAlert,
  fetchProvinces,
  polishText,
  type ProvinceOption,
} from "../lib/api";
import {
  hapticDiscreteConfirm,
  hapticSosConfirm,
} from "../lib/haptics";
import { messages } from "../lib/i18n";
import { readTrustedContacts } from "../lib/trusted-contacts-prefs";
import { colors } from "../theme/colors";
import { IconSpark } from "./icons";

type Step = "tell" | "place";

export function AlertFlow({
  source,
  discrete = false,
}: {
  source: "sos_button" | "witness" | "shake";
  discrete?: boolean;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = messages[locale];
  const isWitness = source === "witness";
  const theme = discrete ? discreteTheme : lightTheme;

  const [step, setStep] = useState<Step>("tell");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [polishing, setPolishing] = useState(false);

  const cities = useMemo(() => {
    return provinces.find((p) => p.id === provinceId)?.cities ?? [];
  }, [provinces, provinceId]);

  const canSend = message.trim().length >= 3;

  useEffect(() => {
    void fetchProvinces().then(setProvinces).catch(() => setProvinces([]));
  }, []);

  async function submit(opts: {
    shareLocation?: boolean;
    lat?: number;
    lng?: number;
    provinceId?: string;
    cityId?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const trustedContacts = await readTrustedContacts();
      const result = await createAlert({
        message: message.trim(),
        locale,
        source,
        discrete,
        shareLocation: opts.shareLocation,
        lat: opts.lat ?? null,
        lng: opts.lng ?? null,
        provinceId: opts.provinceId ?? null,
        cityId: opts.cityId ?? null,
        trustedContacts: trustedContacts.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email ?? null,
          address: c.address ?? null,
          relation: c.relation ?? null,
        })),
      });
      if (discrete) await hapticDiscreteConfirm();
      else await hapticSosConfirm();
      router.replace({
        pathname: "/session/[id]",
        params: { id: result.id, discrete: discrete ? "1" : "0" },
      });
    } catch {
      setError(t.errorGeneric);
      setBusy(false);
    }
  }

  async function requestGps() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setHint(t.errorGeneric);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await submit({
      shareLocation: true,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    });
  }

  async function clarify() {
    if (polishing || message.trim().length < 3) return;
    setPolishing(true);
    try {
      const next = await polishText(message, locale);
      setMessage(next);
    } finally {
      setPolishing(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.back, { color: theme.muted }]}>{t.back}</Text>
          </Pressable>
          <View style={styles.aiBadge}>
            <IconSpark size={14} color={theme.accent} />
            <Text style={[styles.aiBadgeText, { color: theme.accent }]}>
              {t.aiListening}
            </Text>
          </View>
        </View>

        {step === "tell" ? (
          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.accent }]}>
              {discrete
                ? t.discrete
                : isWitness
                  ? t.witnessTell
                  : t.tell}
            </Text>
            {isWitness && !discrete ? (
              <Text style={[styles.safety, { color: theme.muted }]}>
                {t.witnessSafety}
              </Text>
            ) : null}
            {discrete ? (
              <Text style={[styles.safety, { color: theme.muted }]}>
                {t.discreteSafety}
              </Text>
            ) : null}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t.placeholder}
              placeholderTextColor={theme.placeholder}
              multiline
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
            <Pressable
              disabled={polishing || message.trim().length < 3}
              onPress={() => void clarify()}
              style={({ pressed }) => [
                styles.polishBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                  opacity:
                    polishing || message.trim().length < 3
                      ? 0.5
                      : pressed
                        ? 0.9
                        : 1,
                },
              ]}
            >
              <IconSpark size={14} color={theme.accent} />
              <Text style={[styles.polishBtnText, { color: theme.accent }]}>
                {polishing ? t.polishing : t.polish}
              </Text>
            </Pressable>
            <Pressable
              disabled={!canSend || busy}
              onPress={() =>
                discrete ? void submit({}) : setStep("place")
              }
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: discrete ? colors.secondary : colors.urgent,
                  opacity: !canSend || busy ? 0.5 : pressed ? 0.9 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {discrete ? t.discreteSend : t.send}
                </Text>
              )}
            </Pressable>
            {error ? (
              <Text style={styles.error}>{error}</Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.accent }]}>
              {t.gpsAsk}
            </Text>
            <Pressable
              disabled={busy}
              onPress={() => void requestGps()}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>{t.shareGps}</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => void submit({})}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>{t.skipGps}</Text>
            </Pressable>
            {provinces.length > 0 ? (
              <View style={styles.placeBlock}>
                <Text style={[styles.placeLabel, { color: theme.muted }]}>
                  {t.provincePick}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {provinces.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setProvinceId(p.id);
                        setCityId("");
                      }}
                      style={[
                        styles.chip,
                        provinceId === p.id && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          provinceId === p.id && styles.chipTextActive,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {cities.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 8 }}
                  >
                    {cities.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() => setCityId(c.id)}
                        style={[
                          styles.chip,
                          cityId === c.id && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            cityId === c.id && styles.chipTextActive,
                          ]}
                        >
                          {c.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
                <Pressable
                  disabled={!provinceId || busy}
                  onPress={() =>
                    void submit({ provinceId, cityId: cityId || undefined })
                  }
                  style={[
                    styles.secondaryBtn,
                    { opacity: provinceId ? 1 : 0.5 },
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>{t.usePlace}</Text>
                </Pressable>
              </View>
            ) : null}
            {hint ? <Text style={styles.error}>{hint}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
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
  inputBg: colors.surface,
  border: colors.border,
  placeholder: colors.muted,
};

const discreteTheme = {
  bg: colors.discreteBg,
  accent: "#e8d4e3",
  muted: colors.discreteMuted,
  text: colors.discreteText,
  inputBg: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.1)",
  placeholder: "rgba(245,240,244,0.45)",
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
  back: { fontSize: 14, fontWeight: "600" },
  topRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiBadgeText: { fontSize: 11, fontWeight: "700" },
  body: { marginTop: 20 },
  title: { fontSize: 20, fontWeight: "700" },
  safety: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  input: {
    marginTop: 16,
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    textAlignVertical: "top",
  },
  polishBtn: {
    marginTop: 12,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  polishBtnText: { fontSize: 12, fontWeight: "700" },
  primaryBtn: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  placeBlock: { marginTop: 20 },
  placeLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  chipTextActive: { color: "#fff" },
  error: {
    marginTop: 12,
    color: colors.urgent,
    fontSize: 13,
    fontWeight: "600",
  },
});
