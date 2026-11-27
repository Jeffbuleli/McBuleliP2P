import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LandingTopBar } from "@/components/landing/landing-top-bar";

export const metadata: Metadata = {
  title: "Résumé animateur · Soirée 1 | Formation IA",
  description:
    "Table des matières de la soirée du 27 novembre : ouvrir, outils, méthode, cas, forme, premier pas.",
  robots: { index: false, follow: false },
};

const TOC = [
  { id: "ouvrir", n: "1", label: "Ouvrir" },
  { id: "outils", n: "2", label: "Outils" },
  { id: "methode", n: "3", label: "Méthode" },
  { id: "cas", n: "4", label: "Le cas" },
  { id: "forme", n: "5", label: "La forme" },
  { id: "pas", n: "6", label: "Premier pas" },
  { id: "suite", n: "7", label: "Suite" },
] as const;

export default function Nov26ResumePage() {
  return (
    <div className="min-h-dvh bg-[color:var(--hk-page,var(--fd-bg))]">
      <LandingTopBar authReturnPath="/nov26/resume" />
      <div className="sticky top-0 z-20 border-b border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))]/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-2">
          <p className="text-[11px] font-bold leading-snug text-[color:var(--hk-text,var(--fd-text))]">
            Chacun repart avec son projet.
          </p>
          <nav aria-label="Table des matières" className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="shrink-0 rounded-full border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-surface,var(--fd-card))] px-2.5 py-1 text-[11px] font-bold text-[color:var(--hk-text,var(--fd-text))]"
              >
                {item.n} {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 py-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent,var(--fd-primary))]">
          Animateur · 27 novembre · 19h30 GMT+1
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[color:var(--hk-text,var(--fd-text))]">
          Soirée 1 · Votre cas
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
          Même méthode, cas différents. Suivre les blocs dans l’ordre. La voix, le webhook et l’API attendent le cas qui les demande.
        </p>

        <ol className="mt-6 space-y-4">
          <Block
            id="ouvrir"
            n="1"
            title="Ouvrir"
            goal="La salle comprend que ce n’est pas un exercice commun."
          >
            <Step>Meet ouvert. Noter qui est là.</Step>
            <Step>Noter qui n’a pas Cursor.</Step>
            <Say>Chacun repart avec son projet, pas avec le même exercice.</Say>
          </Block>

          <Block
            id="outils"
            n="2"
            title="Outils"
            goal="Cursor est ouvert avant le contenu."
          >
            <Step>Ordinateur et connexion. Le téléphone sert à suivre.</Step>
            <Step>Navigateur à jour, compte Google pour Meet.</Step>
            <Step>Compte McBuleli : le même e-mail que l’inscription.</Step>
            <Step>Cursor installé, Claude ou Codex dedans. Le compte gratuit suffit.</Step>
            <Step>Débloquer les comptes coincés ici. Le contenu commence après.</Step>
          </Block>

          <Block
            id="methode"
            n="3"
            title="La méthode, une fois"
            goal="Le groupe a vu le cycle. Une démo, pas le projet de quelqu’un."
          >
            <Step>Demander.</Step>
            <Step>Lire la réponse.</Step>
            <Step>Corriger.</Step>
            <Step>Avancer.</Step>
            <Say>On relit avant d’accepter.</Say>
          </Block>

          <Block
            id="cas"
            n="4"
            title="Le cas de chacun"
            goal="Chaque personne a un destinataire et un livrable pour samedi."
          >
            <Step>Tour de table. Une phrase : pour qui c’est.</Step>
            <Step>Une phrase : ce qui doit exister au soir 3, samedi 29.</Step>
            <Step>Si c’est trop large pour trois soirées, réduire maintenant.</Step>
            <Say>Noter les deux phrases. Elles servent demain.</Say>
          </Block>

          <Block
            id="forme"
            n="5"
            title="La forme"
            goal="Une forme est dite à voix haute."
          >
            <Step>Écran.</Step>
            <Step>Texte.</Step>
            <Step>Voix.</Step>
            <Step>API.</Step>
            <Say>Une seule forme pour ce soir. Les autres arrivent si le cas les demande.</Say>
          </Block>

          <Block
            id="pas"
            n="6"
            title="Premier pas"
            goal="Le projet est ouvert, et le devoir de demain est nommé."
          >
            <Step>Lancer le premier pas dans Cursor avant de quitter Meet.</Step>
            <Step>Dire quoi finir avant demain, 19h30.</Step>
            <Say>Demain on construit ce qui est déjà commencé.</Say>
          </Block>

          <Block
            id="suite"
            n="7"
            title="Où ça mène"
            goal="Ce soir pose le cas. Les deux soirées suivantes le construisent et le montrent."
          >
            <Step>28 nov · Construire. Tour court, travail par cas, un blocage montré à tout le monde, chaque projet s’ouvre à la fin.</Step>
            <Step>29 nov · Démo. Montrer même incomplet, dire la suite, avantages apprenants, nom sur le brevet.</Step>
          </Block>
        </ol>

        <section className="mt-6 rounded-2xl border border-[color:var(--hk-accent,var(--fd-primary))]/30 bg-[color:var(--hk-soft,var(--fd-mint))]/40 p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--hk-accent,var(--fd-primary))]">
            Avant de couper Meet
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-snug text-[color:var(--hk-text,var(--fd-text))]">
            <li>Présents notés.</li>
            <li>Cursor ouvert, ou aide nommée.</li>
            <li>Destinataire et livrable de samedi dits.</li>
            <li>Forme choisie.</li>
            <li>Premier pas lancé, devoir de demain dit.</li>
          </ul>
        </section>

        <p className="mt-6 text-center text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
          <Link href="/nov26#programme" className="font-semibold underline">
            Programme public
          </Link>
        </p>
      </main>
    </div>
  );
}

function Block({
  id,
  n,
  title,
  goal,
  children,
}: {
  id: string;
  n: string;
  title: string;
  goal: string;
  children: ReactNode;
}) {
  return (
    <li
      id={id}
      className="scroll-mt-28 list-none rounded-2xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-surface,var(--fd-card))] p-4"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-black tabular-nums text-[color:var(--hk-accent,var(--fd-primary))]">
          {n}
        </span>
        <h2 className="text-base font-black text-[color:var(--hk-text,var(--fd-text))]">{title}</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">{goal}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </li>
  );
}

function Step({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 text-sm leading-snug text-[color:var(--hk-text,var(--fd-text))]">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--hk-accent,var(--fd-primary))]" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function Say({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-[color:var(--hk-accent,var(--fd-primary))] pl-3 text-sm font-semibold leading-snug text-[color:var(--hk-text,var(--fd-text))]">
      {children}
    </p>
  );
}
