"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AssistantWidget = dynamic(
  () =>
    import("@/components/assistant/assistant-widget").then(
      (m) => m.AssistantWidget,
    ),
  { ssr: false },
);

/** Defer assistant bundle until the browser is idle — lighter landing first paint. */
export function AssistantLauncher() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = () => setReady(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(mount, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(mount, 2500);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return null;
  return <AssistantWidget />;
}
