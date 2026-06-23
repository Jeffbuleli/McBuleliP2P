"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useScrollChrome } from "@/hooks/use-scroll-chrome";

const AssistantWidget = dynamic(
  () =>
    import("@/components/assistant/assistant-widget").then(
      (m) => m.AssistantWidget,
    ),
  { ssr: false },
);

const HIDE_PREFIXES = [
  "/app/support",
  "/admin",
  "/app/community/inbox",
  "/app/community/chat",
  "/app/p2p/order/",
  "/app/wallet/deposit",
  "/app/wallet/withdraw",
];

function shouldHideAssistant(pathname: string | null): boolean {
  if (!pathname) return false;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/\/app\/academy\/[^/]+\/live\//.test(pathname)) return true;
  return false;
}

/** Defer assistant bundle until idle; hide on dense chat/flow screens. */
export function AssistantLauncher() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const hideByRoute = shouldHideAssistant(pathname);
  const scrollHide = useScrollChrome(
    Boolean(pathname?.startsWith("/app") && !hideByRoute),
  );

  useEffect(() => {
    const mount = () => setReady(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(mount, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(mount, 2500);
    return () => window.clearTimeout(t);
  }, []);

  if (hideByRoute || !ready) return null;
  return <AssistantWidget chromeHidden={scrollHide} />;
}
