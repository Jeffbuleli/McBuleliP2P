import { getLocale } from "@/lib/get-locale";
import { getCertificateByCode } from "@/lib/hackathon/certificates";
import { HackathonCertificateView } from "@/components/hackathon/hackathon-certificate-view";

export const dynamic = "force-dynamic";

export default async function HackathonCertificatPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const locale = await getLocale();
  const isFr = locale !== "en";
  const cert = await getCertificateByCode(code);

  if (!cert) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm text-stone-600">
          {isFr ? "Certificat introuvable." : "Certificate not found."}
        </p>
        <a
          href="/hackathon"
          className="mt-4 inline-block text-sm font-semibold text-[#305f33] hover:underline"
        >
          mcbuleli.org/hackathon
        </a>
      </main>
    );
  }

  return (
    <HackathonCertificateView
      cert={cert}
      isFr={isFr}
      autoPrint={sp.print === "1"}
    />
  );
}
