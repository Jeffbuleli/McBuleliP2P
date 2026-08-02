"use client";

import type { ReactNode } from "react";
import type { SlideIllustrationId } from "@/lib/hackathon/slides/types";

type Props = {
  id: SlideIllustrationId;
  className?: string;
};

function Frame({
  children,
  className,
}: {
  children: ReactNode;
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
      {children}
    </svg>
  );
}

function VibeLoop() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #eaf6ee)" />
      <circle cx="70" cy="110" r="36" fill="var(--slide-accent, #1f6b43)" opacity="0.15" />
      <circle cx="160" cy="70" r="36" fill="var(--slide-accent, #1f6b43)" opacity="0.2" />
      <circle cx="250" cy="110" r="36" fill="var(--slide-accent, #1f6b43)" opacity="0.15" />
      <circle cx="160" cy="160" r="36" fill="var(--slide-accent, #1f6b43)" opacity="0.25" />
      <path
        d="M95 100 C120 60, 200 60, 225 100"
        stroke="var(--slide-accent, #1f6b43)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M230 125 C210 165, 110 165, 90 125"
        stroke="var(--slide-accent, #1f6b43)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
      <text x="52" y="115" fill="var(--slide-deep, #0f3d26)" fontSize="11" fontWeight="700">
        Intent
      </text>
      <text x="140" y="75" fill="var(--slide-deep, #0f3d26)" fontSize="11" fontWeight="700">
        Prompt
      </text>
      <text x="232" y="115" fill="var(--slide-deep, #0f3d26)" fontSize="11" fontWeight="700">
        Code
      </text>
      <text x="142" y="165" fill="var(--slide-deep, #0f3d26)" fontSize="11" fontWeight="700">
        Review
      </text>
    </Frame>
  );
}

function CursorIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #e0f2fe)" />
      <rect x="36" y="36" width="248" height="148" rx="12" fill="#0f172a" />
      <rect x="36" y="36" width="248" height="28" rx="12" fill="#1e293b" />
      <circle cx="52" cy="50" r="4" fill="#f87171" />
      <circle cx="66" cy="50" r="4" fill="#fbbf24" />
      <circle cx="80" cy="50" r="4" fill="#34d399" />
      <rect x="52" y="80" width="120" height="8" rx="2" fill="#38bdf8" opacity="0.9" />
      <rect x="52" y="98" width="180" height="6" rx="2" fill="#64748b" />
      <rect x="52" y="112" width="160" height="6" rx="2" fill="#64748b" />
      <rect x="52" y="126" width="100" height="6" rx="2" fill="#22c55e" />
      <path d="M210 150 L230 170 L218 170 L210 190 Z" fill="var(--slide-accent, #0284c7)" />
    </Frame>
  );
}

function ClaudeIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #fef3c7)" />
      <ellipse cx="160" cy="118" rx="78" ry="58" fill="var(--slide-accent, #d97706)" opacity="0.2" />
      <path
        d="M110 130 Q160 60 210 130 Q160 150 110 130"
        fill="var(--slide-accent, #d97706)"
        opacity="0.85"
      />
      <circle cx="140" cy="112" r="6" fill="#fff7ed" />
      <circle cx="180" cy="112" r="6" fill="#fff7ed" />
      <rect x="70" y="168" width="180" height="14" rx="7" fill="var(--slide-deep, #92400e)" opacity="0.2" />
      <rect x="100" y="168" width="90" height="14" rx="7" fill="var(--slide-accent, #d97706)" />
    </Frame>
  );
}

function CodexIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #eef2ff)" />
      <rect x="48" y="48" width="224" height="124" rx="14" fill="#312e81" />
      <text x="68" y="88" fill="#a5b4fc" fontSize="14" fontFamily="monospace">{`{`}</text>
      <text x="84" y="110" fill="#c7d2fe" fontSize="12" fontFamily="monospace">
        gen(code)
      </text>
      <text x="84" y="132" fill="#818cf8" fontSize="12" fontFamily="monospace">
        → patch
      </text>
      <text x="68" y="154" fill="#a5b4fc" fontSize="14" fontFamily="monospace">{`}`}</text>
      <rect x="200" y="96" width="48" height="48" rx="10" fill="var(--slide-accent, #4f46e5)" />
      <path d="M214 120 h20 M224 110 v20" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

function GithubIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #f1f5f9)" />
      <circle cx="160" cy="100" r="48" fill="#0f172a" />
      <path
        d="M140 118 C140 130, 150 138, 160 138 C170 138, 180 130, 180 118"
        stroke="#94a3b8"
        strokeWidth="4"
        fill="none"
      />
      <circle cx="145" cy="92" r="5" fill="#e2e8f0" />
      <circle cx="175" cy="92" r="5" fill="#e2e8f0" />
      <path
        d="M80 170 H240"
        stroke="var(--slide-accent, #475569)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="110" cy="170" r="7" fill="var(--slide-accent, #475569)" />
      <circle cx="160" cy="170" r="7" fill="var(--slide-accent, #475569)" />
      <circle cx="210" cy="170" r="7" fill="var(--slide-accent, #475569)" />
    </Frame>
  );
}

function WorkspaceIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #eaf6ee)" />
      <rect x="40" y="50" width="100" height="120" rx="10" fill="#fff" stroke="var(--slide-accent, #1f6b43)" />
      <rect x="52" y="68" width="76" height="8" rx="2" fill="var(--slide-accent, #1f6b43)" opacity="0.4" />
      <rect x="52" y="86" width="60" height="6" rx="2" fill="#94a3b8" />
      <rect x="52" y="100" width="70" height="6" rx="2" fill="#94a3b8" />
      <rect x="160" y="50" width="120" height="70" rx="10" fill="#0f172a" />
      <rect x="172" y="66" width="70" height="6" rx="2" fill="#38bdf8" />
      <rect x="172" y="80" width="90" height="6" rx="2" fill="#64748b" />
      <rect x="160" y="132" width="120" height="38" rx="10" fill="var(--slide-accent, #1f6b43)" />
      <text x="178" y="156" fill="white" fontSize="12" fontWeight="700">
        .env local
      </text>
    </Frame>
  );
}

function AiRole() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #eef2ff)" />
      <rect x="48" y="70" width="100" height="90" rx="16" fill="var(--slide-accent, #4f46e5)" />
      <text x="68" y="122" fill="white" fontSize="13" fontWeight="700">
        Vous
      </text>
      <path d="M160 115 H190" stroke="var(--slide-deep, #312e81)" strokeWidth="3" markerEnd="url(#arrow)" />
      <rect x="200" y="70" width="80" height="90" rx="16" fill="#0f172a" />
      <circle cx="240" cy="105" r="16" fill="#818cf8" />
      <text x="214" y="145" fill="#c7d2fe" fontSize="11" fontWeight="700">
        IA
      </text>
    </Frame>
  );
}

function ToolsGrid() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #e0f2fe)" />
      {[
        { x: 44, y: 44, label: "Cursor" },
        { x: 172, y: 44, label: "Claude" },
        { x: 44, y: 120, label: "Codex" },
        { x: 172, y: 120, label: "GitHub" },
      ].map((c) => (
        <g key={c.label}>
          <rect
            x={c.x}
            y={c.y}
            width="104"
            height="60"
            rx="14"
            fill="white"
            stroke="var(--slide-accent, #0284c7)"
            strokeWidth="2"
          />
          <text
            x={c.x + 52}
            y={c.y + 36}
            textAnchor="middle"
            fill="var(--slide-deep, #075985)"
            fontSize="13"
            fontWeight="700"
          >
            {c.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

function Generic({
  label,
  soft,
}: {
  label: string;
  soft?: string;
}) {
  return (
    <Frame>
      <rect
        width="320"
        height="220"
        rx="24"
        fill={soft ?? "var(--slide-soft, #eaf6ee)"}
      />
      <circle
        cx="160"
        cy="100"
        r="44"
        fill="var(--slide-accent, #1f6b43)"
        opacity="0.2"
      />
      <circle cx="160" cy="100" r="28" fill="var(--slide-accent, #1f6b43)" />
      <text
        x="160"
        y="170"
        textAnchor="middle"
        fill="var(--slide-deep, #0f3d26)"
        fontSize="14"
        fontWeight="700"
      >
        {label}
      </text>
    </Frame>
  );
}

function LimitsIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #ffe4e6)" />
      <rect x="70" y="50" width="180" height="120" rx="16" fill="white" stroke="var(--slide-accent, #e11d48)" strokeWidth="3" />
      <path d="M160 80 v40" stroke="var(--slide-accent, #e11d48)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="160" cy="140" r="5" fill="var(--slide-accent, #e11d48)" />
      <text x="160" y="195" textAnchor="middle" fill="var(--slide-deep, #9f1239)" fontSize="13" fontWeight="700">
        Limites
      </text>
    </Frame>
  );
}

function PromptCraft() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #fef3c7)" />
      <rect x="48" y="56" width="224" height="108" rx="14" fill="white" stroke="var(--slide-accent, #d97706)" />
      <rect x="64" y="76" width="140" height="10" rx="3" fill="var(--slide-accent, #d97706)" opacity="0.35" />
      <rect x="64" y="96" width="180" height="8" rx="3" fill="#cbd5e1" />
      <rect x="64" y="114" width="160" height="8" rx="3" fill="#cbd5e1" />
      <rect x="64" y="132" width="100" height="8" rx="3" fill="#cbd5e1" />
    </Frame>
  );
}

function IdeaToSpec() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #f3e8ff)" />
      <circle cx="80" cy="110" r="28" fill="var(--slide-accent, #7c3aed)" opacity="0.25" />
      <text x="66" y="116" fill="var(--slide-deep, #5b21b6)" fontSize="12" fontWeight="700">
        Idée
      </text>
      <path d="M115 110 H145" stroke="var(--slide-accent, #7c3aed)" strokeWidth="3" />
      <rect x="150" y="78" width="120" height="64" rx="12" fill="var(--slide-accent, #7c3aed)" />
      <text x="170" y="116" fill="white" fontSize="12" fontWeight="700">
        Cahier des charges
      </text>
    </Frame>
  );
}

function BuildStack() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #e0f2fe)" />
      {["UI", "API", "DB"].map((label, i) => (
        <rect
          key={label}
          x={60}
          y={50 + i * 42}
          width={200}
          height={34}
          rx={10}
          fill={i === 0 ? "var(--slide-accent, #0284c7)" : i === 1 ? "#0369a1" : "#0c4a6e"}
        />
      ))}
      <text x="150" y="72" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">
        Frontend
      </text>
      <text x="150" y="114" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">
        Backend / API
      </text>
      <text x="150" y="156" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">
        Base de données
      </text>
    </Frame>
  );
}

function DebugIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #ffe4e6)" />
      <rect x="56" y="60" width="208" height="100" rx="12" fill="#0f172a" />
      <text x="76" y="100" fill="#f87171" fontSize="14" fontFamily="monospace">
        Error: …
      </text>
      <text x="76" y="124" fill="#94a3b8" fontSize="12" fontFamily="monospace">
        at app/page.tsx
      </text>
      <rect x="200" y="140" width="48" height="20" rx="6" fill="var(--slide-accent, #e11d48)" />
    </Frame>
  );
}

function GitFlow() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #f1f5f9)" />
      <path
        d="M70 150 C120 150, 120 70, 180 70 C230 70, 230 150, 270 150"
        stroke="var(--slide-accent, #475569)"
        strokeWidth="4"
        fill="none"
      />
      <circle cx="70" cy="150" r="10" fill="var(--slide-accent, #475569)" />
      <circle cx="180" cy="70" r="10" fill="#22c55e" />
      <circle cx="270" cy="150" r="10" fill="var(--slide-accent, #475569)" />
      <text x="150" y="55" fill="var(--slide-deep, #1e293b)" fontSize="12" fontWeight="700">
        feature
      </text>
      <text x="50" y="180" fill="var(--slide-deep, #1e293b)" fontSize="12" fontWeight="700">
        main
      </text>
    </Frame>
  );
}

function SecurityIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #ffe4e6)" />
      <path
        d="M160 48 L220 72 V120 C220 155 190 175 160 185 C130 175 100 155 100 120 V72 Z"
        fill="var(--slide-accent, #e11d48)"
        opacity="0.9"
      />
      <rect x="145" y="105" width="30" height="36" rx="6" fill="white" />
      <circle cx="160" cy="98" r="10" stroke="white" strokeWidth="4" fill="none" />
    </Frame>
  );
}

function ProjectIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #dcfce7)" />
      <rect x="70" y="50" width="180" height="120" rx="14" fill="white" stroke="var(--slide-accent, #166534)" strokeWidth="3" />
      <rect x="90" y="70" width="80" height="10" rx="3" fill="var(--slide-accent, #166534)" />
      <rect x="90" y="92" width="140" height="8" rx="3" fill="#86efac" />
      <rect x="90" y="110" width="120" height="8" rx="3" fill="#86efac" />
      <rect x="90" y="140" width="60" height="18" rx="6" fill="var(--slide-accent, #166534)" />
    </Frame>
  );
}

function EvalIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #eaf6ee)" />
      <rect x="60" y="50" width="200" height="120" rx="14" fill="white" stroke="var(--slide-accent, #1f6b43)" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={80}
          y={70 + i * 22}
          width={40 + i * 28}
          height={12}
          rx={4}
          fill="var(--slide-accent, #1f6b43)"
          opacity={0.4 + i * 0.15}
        />
      ))}
    </Frame>
  );
}

function QuizIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #eef2ff)" />
      <circle cx="160" cy="100" r="50" fill="var(--slide-accent, #4f46e5)" />
      <text x="160" y="112" textAnchor="middle" fill="white" fontSize="42" fontWeight="800">
        ?
      </text>
    </Frame>
  );
}

function HomeworkIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #eaf6ee)" />
      <rect x="90" y="40" width="140" height="150" rx="10" fill="white" stroke="var(--slide-accent, #1f6b43)" strokeWidth="3" />
      <rect x="110" y="60" width="100" height="8" rx="2" fill="var(--slide-accent, #1f6b43)" opacity="0.4" />
      <rect x="110" y="84" width="16" height="16" rx="3" fill="var(--slide-accent, #1f6b43)" />
      <rect x="134" y="86" width="70" height="10" rx="2" fill="#cbd5e1" />
      <rect x="110" y="114" width="16" height="16" rx="3" fill="var(--slide-accent, #1f6b43)" />
      <rect x="134" y="116" width="70" height="10" rx="2" fill="#cbd5e1" />
      <rect x="110" y="144" width="16" height="16" rx="3" stroke="var(--slide-accent, #1f6b43)" strokeWidth="2" />
      <rect x="134" y="146" width="70" height="10" rx="2" fill="#cbd5e1" />
    </Frame>
  );
}

function AgendaIllu() {
  return (
    <Frame>
      <rect width="320" height="220" rx="24" fill="var(--slide-soft, #f1f5f9)" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <circle
            cx="70"
            cy={50 + i * 30}
            r="10"
            fill={i === 1 ? "var(--slide-accent, #475569)" : "#cbd5e1"}
          />
          <rect
            x="95"
            y={44 + i * 30}
            width={140 - i * 8}
            height="12"
            rx="4"
            fill={i === 1 ? "var(--slide-accent, #475569)" : "#e2e8f0"}
          />
        </g>
      ))}
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
    <div className={className ?? "aspect-[320/220] w-full max-w-md"}>
      <Comp />
    </div>
  );
}
