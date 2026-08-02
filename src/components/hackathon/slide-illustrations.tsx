"use client";

import type { ReactNode } from "react";
import type { SlideIllustrationId } from "@/lib/hackathon/slides/types";

type Props = {
  id: SlideIllustrationId;
  className?: string;
};

function SoftDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--slide-soft, var(--hk-soft, #eaf6ee))" />
        <stop offset="100%" stopColor="var(--hk-surface, #ffffff)" stopOpacity="0.92" />
      </linearGradient>
      <linearGradient id={`${uid}-accent`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--slide-accent, #1f6b43)" />
        <stop
          offset="100%"
          stopColor="color-mix(in srgb, var(--slide-accent, #1f6b43) 70%, #000)"
        />
      </linearGradient>
      <radialGradient id={`${uid}-orb`} cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor="var(--slide-accent, #1f6b43)" stopOpacity="0.22" />
        <stop offset="100%" stopColor="var(--slide-accent, #1f6b43)" stopOpacity="0" />
      </radialGradient>
      <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="8"
          floodColor="var(--hk-text, #222)"
          floodOpacity="0.12"
        />
      </filter>
      <pattern
        id={`${uid}-dots`}
        width="16"
        height="16"
        patternUnits="userSpaceOnUse"
      >
        <circle
          cx="1.5"
          cy="1.5"
          r="1"
          fill="var(--slide-accent, #1f6b43)"
          opacity="0.14"
        />
      </pattern>
    </defs>
  );
}

function Frame({
  children,
  uid,
  className,
}: {
  children: ReactNode;
  uid: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={className ?? "h-full w-full"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <SoftDefs uid={uid} />
      <rect width="320" height="220" rx="22" fill={`url(#${uid}-bg)`} />
      <rect width="320" height="220" rx="22" fill={`url(#${uid}-dots)`} />
      <circle cx="270" cy="36" r="70" fill={`url(#${uid}-orb)`} />
      <circle cx="40" cy="190" r="55" fill={`url(#${uid}-orb)`} opacity="0.7" />
      {children}
    </svg>
  );
}

function VibeLoop() {
  const uid = "vibe";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        {[
          { cx: 72, cy: 112, label: "Intention", x: 72 },
          { cx: 160, cy: 58, label: "Prompt", x: 160 },
          { cx: 248, cy: 112, label: "Code", x: 248 },
          { cx: 160, cy: 168, label: "Review", x: 160 },
        ].map((n) => (
          <g key={n.label}>
            <circle
              cx={n.cx}
              cy={n.cy}
              r="30"
              fill="white"
              stroke="var(--slide-accent, #1f6b43)"
              strokeWidth="2.5"
            />
            <circle cx={n.cx} cy={n.cy} r="10" fill={`url(#${uid}-accent)`} />
            <text
              x={n.x}
              y={n.cy + 46}
              textAnchor="middle"
              fill="var(--hk-text, #222222)"
              fontSize="11"
              fontWeight="700"
            >
              {n.label}
            </text>
          </g>
        ))}
        <path
          d="M98 95 C120 55, 200 55, 222 95"
          stroke="var(--slide-accent, #1f6b43)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M228 128 C205 165, 115 165, 92 128"
          stroke="var(--slide-accent, #1f6b43)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 5"
          fill="none"
          opacity="0.75"
        />
      </g>
    </Frame>
  );
}

function CursorIllu() {
  const uid = "cur";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect x="42" y="34" width="236" height="152" rx="16" fill="#0b1220" />
        <rect x="42" y="34" width="236" height="32" rx="16" fill="#162033" />
        <rect x="42" y="50" width="236" height="16" fill="#162033" />
        <circle cx="60" cy="50" r="4.5" fill="#fb7185" />
        <circle cx="76" cy="50" r="4.5" fill="#fbbf24" />
        <circle cx="92" cy="50" r="4.5" fill="#34d399" />
        <rect x="118" y="44" width="100" height="12" rx="6" fill="#243044" />
        <rect x="58" y="82" width="92" height="9" rx="3" fill="#38bdf8" />
        <rect x="58" y="100" width="168" height="7" rx="2.5" fill="#475569" />
        <rect x="58" y="116" width="148" height="7" rx="2.5" fill="#334155" />
        <rect x="58" y="132" width="118" height="7" rx="2.5" fill="#22c55e" opacity="0.9" />
        <rect x="58" y="148" width="78" height="7" rx="2.5" fill="#64748b" />
        <path
          d="M214 148 L236 172 L222 172 L214 192 Z"
          fill={`url(#${uid}-accent)`}
        />
        <path
          d="M214 148 L236 172 L222 172 L214 192 Z"
          fill="white"
          opacity="0.15"
        />
      </g>
    </Frame>
  );
}

function ClaudeIllu() {
  const uid = "claude";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <ellipse
          cx="160"
          cy="118"
          rx="86"
          ry="62"
          fill="var(--slide-accent, #d97706)"
          opacity="0.14"
        />
        <path
          d="M104 132 C112 78, 208 78, 216 132 C188 158, 132 158, 104 132 Z"
          fill={`url(#${uid}-accent)`}
        />
        <path
          d="M118 126 C128 98, 192 98, 202 126"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
        />
        <circle cx="138" cy="114" r="7" fill="#fff7ed" />
        <circle cx="182" cy="114" r="7" fill="#fff7ed" />
        <circle cx="140" cy="115" r="2.5" fill="var(--hk-text, #222222)" />
        <circle cx="184" cy="115" r="2.5" fill="var(--hk-text, #222222)" />
        <rect
          x="78"
          y="172"
          width="164"
          height="16"
          rx="8"
          fill="var(--hk-surface, #ffffff)"
          opacity="0.55"
        />
        <rect
          x="108"
          y="172"
          width="84"
          height="16"
          rx="8"
          fill={`url(#${uid}-accent)`}
        />
      </g>
    </Frame>
  );
}

function CodexIllu() {
  const uid = "codex";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect x="44" y="42" width="232" height="136" rx="18" fill="#1e1b4b" />
        <rect
          x="44"
          y="42"
          width="232"
          height="136"
          rx="18"
          fill="url(#codex-shine)"
          opacity="0.25"
        />
        <text
          x="68"
          y="88"
          fill="#a5b4fc"
          fontSize="15"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          {"{"}
        </text>
        <text
          x="86"
          y="112"
          fill="#e0e7ff"
          fontSize="13"
          fontFamily="ui-monospace, monospace"
        >
          gen(code)
        </text>
        <text
          x="86"
          y="136"
          fill="#818cf8"
          fontSize="13"
          fontFamily="ui-monospace, monospace"
        >
          → patch.diff
        </text>
        <text
          x="68"
          y="160"
          fill="#a5b4fc"
          fontSize="15"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          {"}"}
        </text>
        <rect
          x="204"
          y="98"
          width="50"
          height="50"
          rx="14"
          fill={`url(#${uid}-accent)`}
        />
        <path
          d="M217 123 h24 M229 111 v24"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <linearGradient id="codex-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
        </linearGradient>
      </defs>
    </Frame>
  );
}

function GithubIllu() {
  const uid = "gh";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <circle cx="160" cy="96" r="46" fill="#0f172a" />
        <ellipse cx="160" cy="108" rx="18" ry="14" fill="#1e293b" />
        <path
          d="M142 118 C142 132, 150 140, 160 140 C170 140, 178 132, 178 118"
          stroke="#94a3b8"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="146" cy="88" r="5" fill="#e2e8f0" />
        <circle cx="174" cy="88" r="5" fill="#e2e8f0" />
        <path
          d="M86 168 H234"
          stroke="var(--slide-accent, #475569)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {[110, 160, 210].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="168" r="8" fill={`url(#${uid}-accent)`} />
            {i < 2 ? (
              <path
                d={`M${x + 8} 168 H${x + 42}`}
                stroke="var(--slide-accent, #475569)"
                strokeWidth="3"
              />
            ) : null}
          </g>
        ))}
      </g>
    </Frame>
  );
}

function WorkspaceIllu() {
  const uid = "ws";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="36"
          y="44"
          width="108"
          height="132"
          rx="14"
          fill="var(--hk-surface, #ffffff)"
          stroke="var(--slide-accent, #1f6b43)"
          strokeWidth="2"
        />
        <rect
          x="50"
          y="62"
          width="80"
          height="9"
          rx="3"
          fill="var(--slide-accent, #1f6b43)"
          opacity="0.35"
        />
        <rect x="50" y="82" width="64" height="6" rx="2" fill="#94a3b8" />
        <rect x="50" y="96" width="74" height="6" rx="2" fill="#cbd5e1" />
        <rect x="50" y="110" width="52" height="6" rx="2" fill="#cbd5e1" />
        <rect x="50" y="132" width="36" height="22" rx="7" fill={`url(#${uid}-accent)`} />

        <rect x="158" y="44" width="126" height="74" rx="14" fill="#0f172a" />
        <rect x="172" y="62" width="72" height="7" rx="2" fill="#38bdf8" />
        <rect x="172" y="78" width="96" height="6" rx="2" fill="#475569" />
        <rect x="172" y="92" width="58" height="6" rx="2" fill="#64748b" />

        <rect
          x="158"
          y="132"
          width="126"
          height="44"
          rx="14"
          fill={`url(#${uid}-accent)`}
        />
        <text
          x="221"
          y="159"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="700"
        >
          .env local
        </text>
      </g>
    </Frame>
  );
}

function AiRole() {
  const uid = "ai";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="42"
          y="58"
          width="104"
          height="104"
          rx="22"
          fill={`url(#${uid}-accent)`}
        />
        <circle cx="94" cy="96" r="18" fill="white" opacity="0.2" />
        <text
          x="94"
          y="138"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="800"
        >
          Vous
        </text>
        <path
          d="M158 110 H188"
          stroke="var(--slide-accent, #4f46e5)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M180 102 L192 110 L180 118"
          stroke="var(--slide-accent, #4f46e5)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect x="196" y="58" width="82" height="104" rx="22" fill="#0f172a" />
        <circle cx="237" cy="98" r="20" fill="#818cf8" />
        <circle cx="237" cy="98" r="10" fill="#c7d2fe" />
        <text
          x="237"
          y="140"
          textAnchor="middle"
          fill="#c7d2fe"
          fontSize="13"
          fontWeight="800"
        >
          IA
        </text>
      </g>
    </Frame>
  );
}

function ToolsGrid() {
  const uid = "tools";
  const cards = [
    { x: 40, y: 38, label: "Cursor", tone: "#0284c7" },
    { x: 172, y: 38, label: "Claude", tone: "#d97706" },
    { x: 40, y: 118, label: "Codex", tone: "#4f46e5" },
    { x: 172, y: 118, label: "GitHub", tone: "#475569" },
  ];
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        {cards.map((c) => (
          <g key={c.label}>
            <rect
              x={c.x}
              y={c.y}
              width="108"
              height="64"
              rx="16"
              fill="var(--hk-surface, #ffffff)"
              stroke={c.tone}
              strokeWidth="2"
            />
            <circle cx={c.x + 28} cy={c.y + 32} r="12" fill={c.tone} opacity="0.18" />
            <circle cx={c.x + 28} cy={c.y + 32} r="6" fill={c.tone} />
            <text
              x={c.x + 72}
              y={c.y + 36}
              textAnchor="middle"
              fill="var(--hk-text, #222222)"
              fontSize="13"
              fontWeight="800"
            >
              {c.label}
            </text>
          </g>
        ))}
      </g>
    </Frame>
  );
}

function LimitsIllu() {
  const uid = "lim";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="78"
          y="42"
          width="164"
          height="120"
          rx="20"
          fill="var(--hk-surface, #ffffff)"
          stroke="var(--slide-accent, #e11d48)"
          strokeWidth="3"
        />
        <circle
          cx="160"
          cy="92"
          r="28"
          fill="var(--slide-soft, #ffe4e6)"
          stroke="var(--slide-accent, #e11d48)"
          strokeWidth="3"
        />
        <path
          d="M160 74 v28"
          stroke="var(--slide-accent, #e11d48)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="160" cy="114" r="4" fill="var(--slide-accent, #e11d48)" />
        <text
          x="160"
          y="188"
          textAnchor="middle"
          fill="var(--hk-text, #222222)"
          fontSize="13"
          fontWeight="800"
        >
          Limites
        </text>
      </g>
    </Frame>
  );
}

function PromptCraft() {
  const uid = "prompt";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="46"
          y="48"
          width="228"
          height="124"
          rx="18"
          fill="var(--hk-surface, #ffffff)"
          stroke="var(--slide-accent, #d97706)"
          strokeWidth="2"
        />
        <rect
          x="64"
          y="68"
          width="120"
          height="12"
          rx="4"
          fill="var(--slide-accent, #d97706)"
          opacity="0.35"
        />
        <rect x="64" y="92" width="188" height="9" rx="3" fill="#e2e8f0" />
        <rect x="64" y="112" width="164" height="9" rx="3" fill="#e2e8f0" />
        <rect x="64" y="132" width="104" height="9" rx="3" fill="#e2e8f0" />
        <rect
          x="210"
          y="142"
          width="44"
          height="18"
          rx="9"
          fill={`url(#${uid}-accent)`}
        />
      </g>
    </Frame>
  );
}

function IdeaToSpec() {
  const uid = "idea";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <circle
          cx="78"
          cy="110"
          r="34"
          fill="white"
          stroke="var(--slide-accent, #7c3aed)"
          strokeWidth="2.5"
        />
        <text
          x="78"
          y="115"
          textAnchor="middle"
          fill="var(--hk-text, #222222)"
          fontSize="13"
          fontWeight="800"
        >
          Idée
        </text>
        <path
          d="M118 110 H148"
          stroke="var(--slide-accent, #7c3aed)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M140 102 L152 110 L140 118"
          stroke="var(--slide-accent, #7c3aed)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          x="158"
          y="72"
          width="120"
          height="76"
          rx="16"
          fill={`url(#${uid}-accent)`}
        />
        <text
          x="218"
          y="108"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="800"
        >
          Cahier
        </text>
        <text
          x="218"
          y="126"
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="800"
          opacity="0.9"
        >
          des charges
        </text>
      </g>
    </Frame>
  );
}

function BuildStack() {
  const uid = "build";
  const layers = [
    { y: 48, label: "Frontend", opacity: 1 },
    { y: 94, label: "Backend / API", opacity: 0.88 },
    { y: 140, label: "Base de données", opacity: 0.76 },
  ];
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        {layers.map((l, i) => (
          <g key={l.label}>
            <rect
              x={56 + i * 4}
              y={l.y}
              width={208 - i * 8}
              height="38"
              rx="12"
              fill={`url(#${uid}-accent)`}
              opacity={l.opacity}
            />
            <text
              x="160"
              y={l.y + 24}
              textAnchor="middle"
              fill="white"
              fontSize="13"
              fontWeight="800"
            >
              {l.label}
            </text>
          </g>
        ))}
      </g>
    </Frame>
  );
}

function DebugIllu() {
  const uid = "dbg";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect x="52" y="48" width="216" height="118" rx="16" fill="#0f172a" />
        <rect x="52" y="48" width="216" height="28" rx="16" fill="#1e293b" />
        <rect x="52" y="62" width="216" height="14" fill="#1e293b" />
        <text
          x="70"
          y="100"
          fill="#fb7185"
          fontSize="14"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
        >
          Error: …
        </text>
        <text
          x="70"
          y="124"
          fill="#94a3b8"
          fontSize="12"
          fontFamily="ui-monospace, monospace"
        >
          at app/page.tsx:42
        </text>
        <rect
          x="198"
          y="138"
          width="52"
          height="18"
          rx="7"
          fill={`url(#${uid}-accent)`}
        />
        <text
          x="224"
          y="151"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="800"
        >
          Fix
        </text>
      </g>
    </Frame>
  );
}

function GitFlow() {
  const uid = "git";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <path
          d="M64 154 C118 154, 118 66, 176 66 C230 66, 230 154, 268 154"
          stroke="var(--slide-accent, #475569)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="64" cy="154" r="11" fill={`url(#${uid}-accent)`} />
        <circle cx="176" cy="66" r="12" fill="#22c55e" />
        <circle cx="268" cy="154" r="11" fill={`url(#${uid}-accent)`} />
        <text
          x="176"
          y="48"
          textAnchor="middle"
          fill="var(--hk-text, #222222)"
          fontSize="12"
          fontWeight="800"
        >
          feature
        </text>
        <text
          x="64"
          y="184"
          textAnchor="middle"
          fill="var(--hk-text, #222222)"
          fontSize="12"
          fontWeight="800"
        >
          main
        </text>
      </g>
    </Frame>
  );
}

function SecurityIllu() {
  const uid = "sec";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <path
          d="M160 40 L228 68 V122 C228 162 194 184 160 196 C126 184 92 162 92 122 V68 Z"
          fill={`url(#${uid}-accent)`}
        />
        <path
          d="M160 52 L212 74 V122 C212 152 186 172 160 182 C134 172 108 152 108 122 V74 Z"
          fill="white"
          opacity="0.12"
        />
        <rect x="144" y="112" width="32" height="38" rx="7" fill="var(--hk-surface, #ffffff)" />
        <path
          d="M152 112 V102 C152 94, 168 94, 168 102 V112"
          stroke="white"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </Frame>
  );
}

function ProjectIllu() {
  const uid = "proj";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="68"
          y="42"
          width="184"
          height="130"
          rx="18"
          fill="var(--hk-surface, #ffffff)"
          stroke="var(--slide-accent, #166534)"
          strokeWidth="2.5"
        />
        <rect
          x="88"
          y="64"
          width="88"
          height="12"
          rx="4"
          fill="var(--slide-accent, #166534)"
        />
        <rect x="88" y="90" width="144" height="8" rx="3" fill="#86efac" />
        <rect x="88" y="110" width="120" height="8" rx="3" fill="#bbf7d0" />
        <rect x="88" y="130" width="96" height="8" rx="3" fill="#dcfce7" />
        <rect
          x="88"
          y="150"
          width="64"
          height="22"
          rx="8"
          fill={`url(#${uid}-accent)`}
        />
      </g>
    </Frame>
  );
}

function EvalIllu() {
  const uid = "eval";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="58"
          y="42"
          width="204"
          height="132"
          rx="18"
          fill="var(--hk-surface, #ffffff)"
          stroke="var(--slide-accent, #1f6b43)"
          strokeWidth="2"
        />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={78}
            y={64 + i * 26}
            width={48 + i * 32}
            height={14}
            rx={5}
            fill={`url(#${uid}-accent)`}
            opacity={0.35 + i * 0.18}
          />
        ))}
      </g>
    </Frame>
  );
}

function QuizIllu() {
  const uid = "quiz";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <circle cx="160" cy="104" r="54" fill={`url(#${uid}-accent)`} />
        <circle cx="160" cy="104" r="42" fill="white" opacity="0.12" />
        <text
          x="160"
          y="118"
          textAnchor="middle"
          fill="white"
          fontSize="48"
          fontWeight="900"
        >
          ?
        </text>
      </g>
    </Frame>
  );
}

function HomeworkIllu() {
  const uid = "hw";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <rect
          x="96"
          y="28"
          width="128"
          height="164"
          rx="14"
          fill="var(--hk-surface, #ffffff)"
          stroke="var(--slide-accent, #1f6b43)"
          strokeWidth="2.5"
        />
        <rect
          x="114"
          y="48"
          width="92"
          height="10"
          rx="3"
          fill="var(--slide-accent, #1f6b43)"
          opacity="0.35"
        />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x="114"
              y={78 + i * 34}
              width="18"
              height="18"
              rx="5"
              fill={i < 2 ? `url(#${uid}-accent)` : "white"}
              stroke="var(--slide-accent, #1f6b43)"
              strokeWidth="2"
            />
            {i < 2 ? (
              <path
                d={`M118 ${86 + i * 34} l4 4 l7 -8`}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
            <rect
              x="140"
              y={81 + i * 34}
              width={i === 2 ? 54 : 66}
              height="10"
              rx="3"
              fill="#e2e8f0"
            />
          </g>
        ))}
      </g>
    </Frame>
  );
}

function AgendaIllu() {
  const uid = "ag";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const active = i === 1;
          return (
            <g key={i}>
              {i < 4 ? (
                <path
                  d={`M70 ${58 + i * 30} V${58 + (i + 1) * 30}`}
                  stroke={active ? "var(--slide-accent, #475569)" : "#cbd5e1"}
                  strokeWidth="2.5"
                />
              ) : null}
              <circle
                cx="70"
                cy={58 + i * 30}
                r={active ? 11 : 8}
                fill={active ? `url(#${uid}-accent)` : "#e2e8f0"}
              />
              <rect
                x="92"
                y={50 + i * 30}
                width={active ? 150 : 128 - i * 6}
                height="16"
                rx="6"
                fill={active ? `url(#${uid}-accent)` : "#e2e8f0"}
                opacity={active ? 1 : 0.85}
              />
            </g>
          );
        })}
      </g>
    </Frame>
  );
}

function Generic({ label }: { label: string }) {
  const uid = "gen";
  return (
    <Frame uid={uid}>
      <g filter={`url(#${uid}-shadow)`}>
        <circle cx="160" cy="100" r="40" fill={`url(#${uid}-accent)`} />
        <text
          x="160"
          y="172"
          textAnchor="middle"
          fill="var(--hk-text, #222222)"
          fontSize="13"
          fontWeight="800"
        >
          {label}
        </text>
      </g>
    </Frame>
  );
}

const MAP: Record<SlideIllustrationId, () => ReactNode> = {
  "vibe-loop": VibeLoop,
  "ai-role": AiRole,
  cursor: CursorIllu,
  claude: ClaudeIllu,
  codex: CodexIllu,
  github: GithubIllu,
  workspace: WorkspaceIllu,
  "prompt-craft": PromptCraft,
  "idea-to-spec": IdeaToSpec,
  "build-stack": BuildStack,
  debug: DebugIllu,
  "git-flow": GitFlow,
  security: SecurityIllu,
  project: ProjectIllu,
  eval: EvalIllu,
  quiz: QuizIllu,
  homework: HomeworkIllu,
  agenda: AgendaIllu,
  "tools-grid": ToolsGrid,
  limits: LimitsIllu,
};

export function SlideIllustration({ id, className }: Props) {
  const Comp = MAP[id];
  if (!Comp) return <Generic label={id} />;
  return (
    <div className={className ?? "aspect-[320/220] w-full overflow-hidden rounded-[1.1rem]"}>
      <Comp />
    </div>
  );
}
