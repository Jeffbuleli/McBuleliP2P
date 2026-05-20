"use client";

import { use } from "react";
import { useI18n } from "@/components/i18n-provider";
import { SupportChatroom } from "@/components/support/support-chatroom";
import { adminCls, AdminBackLink } from "@/components/admin/admin-ui";

export default function AdminSupportThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useI18n();

  return (
    <div className={adminCls.page}>
      <AdminBackLink href="/admin/support">{t("admin_support_inbox")}</AdminBackLink>
      <SupportChatroom mode="staff" threadId={id} backHref="/admin/support" />
    </div>
  );
}
