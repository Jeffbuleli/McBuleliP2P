import { GAME_ROLES, type GameRole } from "@/lib/game/constants";

export type LifestyleStage = "starter" | "rising" | "operator" | "mogul";

export type ProgressionView = {
  stage: LifestyleStage;
  stageLabel: string;
  stageLabelFr: string;
  avatarEmoji: string;
  gear: string[];
  gearFr: string[];
  currentRole: GameRole;
  currentRoleLabel: string;
  currentRoleLabelFr: string;
  nextRole: GameRole | null;
  nextRoleXp: number | null;
  xpToNext: number | null;
  unlocks: string[];
  unlocksFr: string[];
};

const ROLE_ORDER: GameRole[] = [
  "artisanal_miner",
  "motorcycle_transporter",
  "truck_operator",
  "mineral_trader",
  "depot_manager",
  "refinery_owner",
  "export_company",
  "mining_corporation",
];

export function lifestyleStage(xp: number, lifestyleTier: number): LifestyleStage {
  if (lifestyleTier >= 3 || xp >= 6000) return "mogul";
  if (lifestyleTier >= 2 || xp >= 1800) return "operator";
  if (xp >= 400) return "rising";
  return "starter";
}

const STAGE_META: Record<
  LifestyleStage,
  { label: string; labelFr: string; emoji: string; gear: string[]; gearFr: string[] }
> = {
  starter: {
    label: "Artisanal miner",
    labelFr: "Mineur artisanal",
    emoji: "⛏️",
    gear: ["Worn clothes", "Manual pickaxe", "Basic camp"],
    gearFr: ["Vêtements usés", "Pioche manuelle", "Camp basique"],
  },
  rising: {
    label: "Rising operator",
    labelFr: "Opérateur montant",
    emoji: "🪖",
    gear: ["Safety helmet", "Boots", "Bicycle"],
    gearFr: ["Casque", "Bottes", "Vélo"],
  },
  operator: {
    label: "Regional operator",
    labelFr: "Opérateur régional",
    emoji: "🏍️",
    gear: ["Motorcycle", "Workers", "Small depot"],
    gearFr: ["Moto", "Ouvriers", "Petit dépôt"],
  },
  mogul: {
    label: "Mining mogul",
    labelFr: "Magnat minier",
    emoji: "🏭",
    gear: ["Fleet trucks", "Office", "Luxury lifestyle"],
    gearFr: ["Flotte camions", "Bureau", "Style de vie luxe"],
  },
};

export function buildProgressionView(args: {
  xp: number;
  lifestyleTier: number;
  role: string;
}): ProgressionView {
  const currentRole = (args.role as GameRole) || "artisanal_miner";
  const stage = lifestyleStage(args.xp, args.lifestyleTier);
  const meta = STAGE_META[stage];
  const idx = ROLE_ORDER.indexOf(currentRole);
  const nextRole = idx >= 0 && idx < ROLE_ORDER.length - 1 ? ROLE_ORDER[idx + 1]! : null;
  const nextRoleXp = nextRole ? GAME_ROLES[nextRole].minXp : null;
  const xpToNext = nextRoleXp != null ? Math.max(0, nextRoleXp - args.xp) : null;

  const unlocks: string[] = [];
  const unlocksFr: string[] = [];
  if (args.xp >= 120) unlocks.push("Motorcycle routes");
  if (args.xp >= 400) unlocks.push("Pickup truck");
  if (args.xp >= 900) unlocks.push("Trader licenses");
  if (args.xp >= 1800) unlocks.push("Depot management");
  if (args.xp >= 120) unlocksFr.push("Routes moto");
  if (args.xp >= 400) unlocksFr.push("Pick-up");
  if (args.xp >= 900) unlocksFr.push("Licences négoce");
  if (args.xp >= 1800) unlocksFr.push("Gestion dépôt");

  return {
    stage,
    stageLabel: meta.label,
    stageLabelFr: meta.labelFr,
    avatarEmoji: meta.emoji,
    gear: meta.gear,
    gearFr: meta.gearFr,
    currentRole,
    currentRoleLabel: GAME_ROLES[currentRole].label,
    currentRoleLabelFr: GAME_ROLES[currentRole].labelFr,
    nextRole,
    nextRoleXp,
    xpToNext,
    unlocks,
    unlocksFr,
  };
}

export function vehicleUnlocked(vehicleKey: string, xp: number): boolean {
  const gates: Record<string, number> = {
    foot: 0,
    bicycle: 0,
    motorcycle: 120,
    pickup: 400,
    truck: 900,
    fleet_truck: 3500,
  };
  return xp >= (gates[vehicleKey] ?? 99999);
}
