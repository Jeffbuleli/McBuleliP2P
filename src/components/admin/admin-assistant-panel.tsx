"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

type KnowledgeItem = {
  id: string;
  slug: string;
  category: string;
  locale: string;
  title: string;
  content: string;
  tags: string[] | null;
  priority: number;
  published: boolean;
};

type Analytics = {
  conversations7d: number;
  messages7d: number;
  recentQuestions: { content: string; createdAt: string }[];
};

export function AdminAssistantPanel() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    category: "platform",
    locale: "all",
    title: "",
    content: "",
    tags: "",
    priority: "50",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [kbRes, anRes] = await Promise.all([
        fetch("/api/admin/assistant/knowledge", { cache: "no-store" }),
        fetch("/api/admin/assistant/knowledge?analytics=1", {
          cache: "no-store",
        }),
      ]);
      const kb = await kbRes.json();
      const an = await anRes.json();
      if (!kbRes.ok) throw new Error(kb.error ?? "Failed");
      setItems(kb.items ?? []);
      if (anRes.ok) setAnalytics(an.analytics ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function backfillEmbeddings() {
    setErr(null);
    const res = await fetch("/api/admin/assistant/knowledge?embed=1", {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed");
    window.alert(`Embedded ${data.embedded ?? 0} knowledge entries.`);
    void load();
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/assistant/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        category: form.category,
        locale: form.locale,
        title: form.title,
        content: form.content,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        priority: Number(form.priority) || 0,
        published: true,
      }),
    });
    if (res.ok) {
      setForm({
        slug: "",
        category: "platform",
        locale: "all",
        title: "",
        content: "",
        tags: "",
        priority: "50",
      });
      void load();
    }
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this knowledge entry?")) return;
    await fetch(`/api/admin/assistant/knowledge?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    void load();
  }

  return (
    <div className={adminCls.page}>
      <h1 className={adminCls.h1}>AI Assistant - Knowledge & Analytics</h1>
      <p className={adminCls.muted}>
        Manage FAQ articles used by the McBuleli virtual assistant (RAG retrieval).
      </p>

      {analytics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className={adminCls.card}>
            <p className={adminCls.kpiLabel}>Conversations (7d)</p>
            <p className={adminCls.kpiValue}>{analytics.conversations7d}</p>
          </div>
          <div className={adminCls.card}>
            <p className={adminCls.kpiLabel}>User messages (7d)</p>
            <p className={adminCls.kpiValue}>{analytics.messages7d}</p>
          </div>
        </div>
      ) : null}

      {analytics?.recentQuestions?.length ? (
        <section className={adminCls.section}>
          <h2 className={adminCls.h2}>Recent questions</h2>
          <ul className="space-y-2">
            {analytics.recentQuestions.slice(0, 10).map((q, i) => (
              <li key={i} className={`${adminCls.card} text-sm`}>
                <p className="text-[color:var(--fd-text)]">{q.content}</p>
                <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                  {new Date(q.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={adminCls.section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={adminCls.h2}>Add / update FAQ</h2>
          <button
            type="button"
            onClick={() => void backfillEmbeddings().catch((e) => setErr(String(e)))}
            className={adminCls.btnSecondary}
          >
            Generate embeddings (OpenAI)
          </button>
        </div>
        <form onSubmit={saveItem} className={`${adminCls.card} space-y-3`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={adminCls.input}
              placeholder="slug (unique-id)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
            <input
              className={adminCls.input}
              placeholder="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
            <select
              className={adminCls.select}
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value })}
            >
              <option value="all">all locales</option>
              <option value="en">en</option>
              <option value="fr">fr</option>
              <option value="sw">sw</option>
            </select>
            <input
              className={adminCls.input}
              placeholder="priority"
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>
          <input
            className={`${adminCls.input} w-full`}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            className={`${adminCls.input} min-h-[120px] w-full`}
            placeholder="Content (used for AI retrieval)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          <input
            className={`${adminCls.input} w-full`}
            placeholder="tags (comma-separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <button type="submit" className={adminCls.btnPrimary}>
            Save knowledge entry
          </button>
        </form>
      </section>

      <section className={adminCls.section}>
        <h2 className={adminCls.h2}>Knowledge base ({items.length})</h2>
        {loading ? <p className={adminCls.muted}>Loading…</p> : null}
        {err ? <p className={adminCls.error}>{err}</p> : null}
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`${adminCls.card} flex flex-wrap items-start justify-between gap-2`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[color:var(--fd-text)]">
                  {item.title}
                </p>
                <p className="text-xs text-[color:var(--fd-muted)]">
                  {item.slug} · {item.category} · {item.locale} · p=
                  {item.priority}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-[color:var(--fd-muted)]">
                  {item.content}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void deleteItem(item.id)}
                className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
