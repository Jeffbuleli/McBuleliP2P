import { Stack, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { LocaleProvider } from "../src/context/locale";

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
      <Stack screenOptions={{ headerShown: false }} />
    </LocaleProvider>
  );
}
