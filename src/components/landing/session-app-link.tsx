"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useSessionAppHref } from "@/hooks/use-session-app-href";

type SessionAppLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

export function SessionAppLink({ href, ...props }: SessionAppLinkProps) {
  const resolved = useSessionAppHref(href);
  return <Link href={resolved} prefetch={false} {...props} />;
}
