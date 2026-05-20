"use client";

import Link from "next/link";
import { use } from "react";
import { useI18n } from "@/components/i18n-provider";
import { SupportChatroom } from "@/components/support/support-chatroom";

export default function AdminSupportThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <Link href="/admin/support" className="text-sm text-amber-200 underline">
        ← {t("admin_support_inbox")}
      </Link>
      <SupportChatroom mode="staff" threadId={id} backHref="/admin/support" />
    </div>
  );
}
