import { getCredentialByVerifyCode } from "@/lib/academy-service";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export default async function VerifyCredentialPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const locale = await getLocale();
  const d = getDictionary(locale);
  const cred = await getCredentialByVerifyCode(code, locale);

  if (!cred) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-stone-600">Credential not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-[#305f33]/30 bg-white p-6 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-wider text-[#305f33]">
          McBuleli Academy
        </p>
        <h1 className="mt-2 text-xl font-black text-stone-900">{cred.title}</h1>
        <p className="mt-3 text-sm text-stone-600">
          {cred.holderDisplay}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          {new Date(cred.issuedAt).toLocaleDateString(
            locale === "fr" ? "fr-FR" : "en-US",
            { dateStyle: "long" },
          )}
        </p>
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-center text-sm font-bold ${
            cred.valid
              ? "bg-[#e8f3ee] text-[#305f33]"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {cred.valid ? "✓ Valid" : "Revoked or invalid"}
        </p>
        <a
          href="https://mcbuleli.org"
          className="mt-6 block text-center text-sm font-semibold text-[#305f33]"
        >
          mcbuleli.org
        </a>
      </div>
      <p className="mt-4 text-center text-[10px] text-stone-400">
        {d.academy_verify_link} · {code}
      </p>
    </main>
  );
}
