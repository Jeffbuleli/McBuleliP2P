import { useLocalSearchParams } from "expo-router";
import { AlertFlow } from "../src/components/AlertFlow";

export default function DiscreteScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const source = from === "shake" ? "shake" : "sos_button";
  return <AlertFlow source={source} discrete />;
}
