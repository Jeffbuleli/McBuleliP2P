import Image from "next/image";
import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { LandingFuturisticBg } from "@/components/landing/landing-futuristic-bg";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

const BULLET_ACCENTS = ["cyan", "magenta", "green", "cyan", "magenta"] as const;

export async function PublicPageShell({
  titleKey,
  leadKey,
  children,
}: {
  titleKey: keyof ReturnType<typeof getDictionary>;
  leadKey?: keyof ReturnType<typeof getDictionary>;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="fd-public-futuristic relative min-h-dvh overflow-hidden text-stone-100">
      <LandingFuturisticBg />
      <header className="relative z-20 border-b border-white/6 bg-[#050810]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/logo-256.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full ring-2 ring-emerald-500/25"
            />
            <span className="text-sm font-extrabold">{d.brand}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90 hover:text-cyan-300 sm:inline"
            >
              ← {d.auth_back_home}
            </Link>
            <LangSwitch variant="dark" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-8 pb-14">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          {d[titleKey] as string}
        </h1>
        {leadKey ? (
          <p className="mt-2 text-sm leading-relaxed text-stone-400">{d[leadKey] as string}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

export function PublicBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={item}>
          <HudFrame
            accent={BULLET_ACCENTS[i % BULLET_ACCENTS.length]}
            className={`${HUD_PANEL_LG} px-4 py-3`}
          >
            <div className="flex gap-3 text-sm leading-relaxed text-stone-300">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-[10px] font-bold text-cyan-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </div>
          </HudFrame>
        </li>
      ))}
    </ul>
  );
}
