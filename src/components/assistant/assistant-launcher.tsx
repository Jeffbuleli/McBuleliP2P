"use client";

import dynamic from "next/dynamic";

const AssistantWidget = dynamic(
  () =>
    import("@/components/assistant/assistant-widget").then(
      (m) => m.AssistantWidget,
    ),
  { ssr: false },
);

export function AssistantLauncher() {
  return <AssistantWidget />;
}
