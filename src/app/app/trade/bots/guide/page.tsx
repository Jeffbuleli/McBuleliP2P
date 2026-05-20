import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function BotsAiGuidePage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  const sections = [
    { title: d.bots_ai_doc_intro, body: null as string | null },
    { title: d.bots_ai_doc_flow_title, body: d.bots_ai_doc_flow_body },
    { title: d.bots_ai_doc_start_title, body: d.bots_ai_doc_start_body },
    { title: d.bots_ai_doc_binance_title, body: d.bots_ai_doc_binance_body },
    { title: d.bots_ai_doc_okx_title, body: d.bots_ai_doc_okx_body },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12 pt-1">
      <Link
        href="/app/trade/bots"
        className="text-sm font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
      >
        ← {d.bots_title}
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-[color:var(--fd-text)]">
          {d.bots_ai_doc_title}
        </h1>
        <p className="text-sm leading-relaxed text-[color:var(--fd-muted)]">
          {d.bots_ai_doc_intro}
        </p>
      </header>

      <ol className="space-y-4">
        {sections.slice(1).map((s) => (
          <li key={s.title} className="fd-card rounded-2xl p-4">
            <h2 className="text-base font-bold text-[color:var(--fd-text)]">{s.title}</h2>
            {s.body ? (
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
                {s.body}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

    </div>
  );
}
