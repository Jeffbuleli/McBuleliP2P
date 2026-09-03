import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LocaleProvider } from "../src/context/locale";

export default function RootLayout() {
  return (
    <LocaleProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </LocaleProvider>
  );
}
