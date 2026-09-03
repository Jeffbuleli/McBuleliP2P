import { Stack, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { LocaleProvider } from "../src/context/locale";
import { hapticDiscreteConfirm } from "../src/lib/haptics";
import { useShakeDetector } from "../src/lib/shake-detector";

function ShakeListener() {
  const router = useRouter();
  const onShake = useCallback(() => {
    void hapticDiscreteConfirm();
    router.push({ pathname: "/discrete", params: { from: "shake" } });
  }, [router]);

  useShakeDetector(onShake, true);
  return null;
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      const path = parsed.path?.replace(/^\//, "") ?? "";
      if (path === "discrete" || path.startsWith("discrete")) {
        router.push("/discrete");
      }
    };
    void Linking.getInitialURL().then((url) => {
      if (url) onUrl({ url });
    });
    const sub = Linking.addEventListener("url", onUrl);
    return () => sub.remove();
  }, [router]);

  return (
    <LocaleProvider>
      <StatusBar style="auto" />
      <ShakeListener />
      <Stack screenOptions={{ headerShown: false }} />
    </LocaleProvider>
  );
}
