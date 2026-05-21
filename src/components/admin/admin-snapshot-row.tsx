import type { ReactNode } from "react";
import Link from "next/link";

export type AdminSnapshotItem = {
  label: string;
  value: ReactNode;
  href?: string;
  tone?: "primary" | "warn" | "neutral";
};

export function AdminSnapshotRow({ items }: { items: AdminSnapshotItem[] }) {
  return (
    <div className="admin-snapshot-row">
      {items.map((item) => {
        const inner = (
          <>
            <p className="admin-total-badge__label">{item.label}</p>
            <p
              className={`admin-total-badge__value ${
                item.tone === "warn"
                  ? "text-rose-600"
                  : item.tone === "neutral"
                    ? "text-[color:var(--fd-text)]"
                    : "text-[color:var(--fd-primary)]"
              }`}
            >
              {item.value}
            </p>
          </>
        );
        if (item.href) {
          return (
            <Link key={item.label} href={item.href} className="admin-total-badge hover:border-[color:var(--fd-primary)]/30">
              {inner}
            </Link>
          );
        }
        return (
          <div key={item.label} className="admin-total-badge">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
