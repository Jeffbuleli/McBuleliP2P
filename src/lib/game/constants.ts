export type MineralKey =
  | "cobalt"
  | "copper"
  | "gold"
  | "coltan"
  | "lithium"
  | "diamonds";

export type GameRole =
  | "artisanal_miner"
  | "motorcycle_transporter"
  | "truck_operator"
  | "mineral_trader"
  | "depot_manager"
  | "refinery_owner"
  | "export_company"
  | "mining_corporation";

export const MINERALS: Record<
  MineralKey,
  {
    label: string;
    labelFr: string;
    rarity: number;
    extractionDifficulty: number;
    basePriceMcb: number;
    transportRisk: number;
  }
> = {
  cobalt: {
    label: "Cobalt",
    labelFr: "Cobalt",
    rarity: 0.7,
    extractionDifficulty: 0.6,
    basePriceMcb: 12,
    transportRisk: 0.12,
  },
  copper: {
    label: "Copper",
    labelFr: "Cuivre",
    rarity: 0.5,
    extractionDifficulty: 0.4,
    basePriceMcb: 6,
    transportRisk: 0.08,
  },
  gold: {
    label: "Gold",
    labelFr: "Or",
    rarity: 0.9,
    extractionDifficulty: 0.85,
    basePriceMcb: 45,
    transportRisk: 0.2,
  },
  coltan: {
    label: "Coltan",
    labelFr: "Coltan",
    rarity: 0.75,
    extractionDifficulty: 0.7,
    basePriceMcb: 18,
    transportRisk: 0.15,
  },
  lithium: {
    label: "Lithium",
    labelFr: "Lithium",
    rarity: 0.65,
    extractionDifficulty: 0.55,
    basePriceMcb: 14,
    transportRisk: 0.1,
  },
  diamonds: {
    label: "Diamonds",
    labelFr: "Diamants",
    rarity: 0.95,
    extractionDifficulty: 0.9,
    basePriceMcb: 80,
    transportRisk: 0.25,
  },
};

export const GAME_ROLES: Record<
  GameRole,
  { label: string; labelFr: string; minXp: number; entryFeeMcb: number }
> = {
  artisanal_miner: { label: "Artisanal Miner", labelFr: "Mineur artisanal", minXp: 0, entryFeeMcb: 0 },
  motorcycle_transporter: {
    label: "Motorcycle Transporter",
    labelFr: "Transporteur moto",
    minXp: 120,
    entryFeeMcb: 2,
  },
  truck_operator: { label: "Truck Operator", labelFr: "Camionneur", minXp: 400, entryFeeMcb: 5 },
  mineral_trader: { label: "Mineral Trader", labelFr: "Négociant", minXp: 900, entryFeeMcb: 8 },
  depot_manager: { label: "Depot Manager", labelFr: "Gestionnaire dépôt", minXp: 1800, entryFeeMcb: 12 },
  refinery_owner: { label: "Refinery Owner", labelFr: "Propriétaire raffinerie", minXp: 3500, entryFeeMcb: 20 },
  export_company: { label: "Export Company", labelFr: "Société export", minXp: 6000, entryFeeMcb: 35 },
  mining_corporation: {
    label: "Mining Corporation",
    labelFr: "Corporation minière",
    minXp: 10000,
    entryFeeMcb: 50,
  },
};

export const VEHICLES = {
  foot: { label: "On foot", labelFr: "À pied", capacityKg: 5, speed: 1, costMcb: 0 },
  bicycle: { label: "Bicycle", labelFr: "Vélo", capacityKg: 15, speed: 1.2, costMcb: 3 },
  motorcycle: { label: "Motorcycle", labelFr: "Moto", capacityKg: 40, speed: 2, costMcb: 15 },
  pickup: { label: "Pickup", labelFr: "Pick-up", capacityKg: 200, speed: 1.8, costMcb: 45 },
  truck: { label: "Truck", labelFr: "Camion", capacityKg: 800, speed: 1.5, costMcb: 120 },
  fleet_truck: { label: "Fleet Truck", labelFr: "Flotte camions", capacityKg: 2000, speed: 1.4, costMcb: 350 },
} as const;

export type UpgradeItem = {
  key: string;
  category: "tool" | "upgrade" | "consumable" | "license";
  label: string;
  labelFr: string;
  costMcb: number;
  minRole: GameRole;
  effects: Record<string, number>;
};

export const UPGRADE_CATALOG: UpgradeItem[] = [
  { key: "pickaxe_basic", category: "tool", label: "Basic Pickaxe", labelFr: "Pioche basique", costMcb: 2, minRole: "artisanal_miner", effects: { miningYield: 1.05 } },
  { key: "pickaxe_steel", category: "tool", label: "Steel Pickaxe", labelFr: "Pioche acier", costMcb: 8, minRole: "artisanal_miner", effects: { miningYield: 1.15 } },
  { key: "pickaxe_industrial", category: "tool", label: "Industrial Drill", labelFr: "Foreuse industrielle", costMcb: 45, minRole: "truck_operator", effects: { miningYield: 1.4 } },
  { key: "helmet", category: "tool", label: "Safety Helmet", labelFr: "Casque sécurité", costMcb: 3, minRole: "artisanal_miner", effects: { riskReduction: 0.05 } },
  { key: "fuel_can", category: "consumable", label: "Fuel Can", labelFr: "Bidon carburant", costMcb: 4, minRole: "motorcycle_transporter", effects: { fuelRestore: 30 } },
  { key: "tire_kit", category: "consumable", label: "Tire Repair Kit", labelFr: "Kit pneus", costMcb: 6, minRole: "motorcycle_transporter", effects: { conditionRestore: 20 } },
  { key: "license_mining", category: "license", label: "Mining License", labelFr: "Licence minière", costMcb: 12, minRole: "artisanal_miner", effects: { siteAccess: 1 } },
  { key: "license_transport", category: "license", label: "Transport Permit", labelFr: "Permis transport", costMcb: 18, minRole: "motorcycle_transporter", effects: { transportSlots: 1 } },
  { key: "camp_upgrade_1", category: "upgrade", label: "Improved Camp", labelFr: "Camp amélioré", costMcb: 20, minRole: "artisanal_miner", effects: { energyCap: 20 } },
  { key: "camp_upgrade_2", category: "upgrade", label: "Worker Shelter", labelFr: "Abri ouvriers", costMcb: 55, minRole: "depot_manager", effects: { workerSlots: 2 } },
  { key: "depot_small", category: "upgrade", label: "Small Depot", labelFr: "Petit dépôt", costMcb: 80, minRole: "mineral_trader", effects: { storageKg: 500 } },
  { key: "depot_large", category: "upgrade", label: "Large Depot", labelFr: "Grand dépôt", costMcb: 200, minRole: "depot_manager", effects: { storageKg: 2000 } },
  { key: "security_fence", category: "upgrade", label: "Security Fence", labelFr: "Clôture sécurité", costMcb: 35, minRole: "mineral_trader", effects: { theftReduction: 0.1 } },
  { key: "gps_tracker", category: "tool", label: "GPS Tracker", labelFr: "Traceur GPS", costMcb: 15, minRole: "motorcycle_transporter", effects: { transportRisk: -0.03 } },
  { key: "water_pump", category: "upgrade", label: "Water Pump", labelFr: "Pompe à eau", costMcb: 25, minRole: "artisanal_miner", effects: { miningYield: 1.08 } },
  { key: "generator", category: "upgrade", label: "Generator", labelFr: "Générateur", costMcb: 40, minRole: "truck_operator", effects: { energyRegen: 1.1 } },
  { key: "weigh_scale", category: "tool", label: "Weigh Scale", labelFr: "Balance", costMcb: 10, minRole: "mineral_trader", effects: { tradeBonus: 0.03 } },
  { key: "lab_kit", category: "tool", label: "Purity Lab Kit", labelFr: "Kit labo pureté", costMcb: 30, minRole: "refinery_owner", effects: { purityBonus: 5 } },
  { key: "refinery_module", category: "upgrade", label: "Refinery Module", labelFr: "Module raffinerie", costMcb: 150, minRole: "refinery_owner", effects: { refineBonus: 0.15 } },
  { key: "export_license", category: "license", label: "Export License", labelFr: "Licence export", costMcb: 90, minRole: "export_company", effects: { exportBonus: 0.12 } },
  { key: "office_basic", category: "upgrade", label: "Field Office", labelFr: "Bureau terrain", costMcb: 60, minRole: "mineral_trader", effects: { reputation: 10 } },
  { key: "office_hq", category: "upgrade", label: "Regional HQ", labelFr: "Siège régional", costMcb: 250, minRole: "mining_corporation", effects: { reputation: 50 } },
  { key: "worker_training", category: "consumable", label: "Worker Training", labelFr: "Formation ouvriers", costMcb: 12, minRole: "depot_manager", effects: { workerSkill: 5 } },
  { key: "insurance_basic", category: "license", label: "Basic Insurance", labelFr: "Assurance basique", costMcb: 8, minRole: "motorcycle_transporter", effects: { lossReduction: 0.05 } },
  { key: "insurance_premium", category: "license", label: "Premium Insurance", labelFr: "Assurance premium", costMcb: 35, minRole: "export_company", effects: { lossReduction: 0.15 } },
  { key: "market_intel", category: "consumable", label: "Market Intel", labelFr: "Renseignement marché", costMcb: 5, minRole: "mineral_trader", effects: { marketInsight: 1 } },
  { key: "rain_gear", category: "tool", label: "Rain Gear", labelFr: "Équipement pluie", costMcb: 4, minRole: "artisanal_miner", effects: { weatherResist: 0.08 } },
  { key: "night_lights", category: "tool", label: "Night Lights", labelFr: "Éclairage nocturne", costMcb: 7, minRole: "artisanal_miner", effects: { miningYield: 1.05 } },
  { key: "radio_comm", category: "tool", label: "Radio Comms", labelFr: "Radio", costMcb: 9, minRole: "truck_operator", effects: { transportRisk: -0.02 } },
  { key: "checkpoint_pass", category: "license", label: "Checkpoint Pass", labelFr: "Passe checkpoint", costMcb: 14, minRole: "motorcycle_transporter", effects: { bribeReduction: 0.1 } },
  { key: "luxury_suit", category: "upgrade", label: "Luxury Suit", labelFr: "Costume luxe", costMcb: 45, minRole: "export_company", effects: { lifestyleTier: 1 } },
  { key: "villa_upgrade", category: "upgrade", label: "Luxury Villa", labelFr: "Villa luxe", costMcb: 500, minRole: "mining_corporation", effects: { lifestyleTier: 2, reputation: 30 } },
  { key: "bar_membership", category: "consumable", label: "Bar Membership", labelFr: "Carte bar", costMcb: 3, minRole: "artisanal_miner", effects: { morale: 10 } },
  { key: "tour_package", category: "consumable", label: "Regional Tour", labelFr: "Tour régional", costMcb: 20, minRole: "mineral_trader", effects: { reputation: 5 } },
  { key: "ai_advisor_plus", category: "consumable", label: "BULEZI Advisor+", labelFr: "Conseiller BULEZI+", costMcb: 2, minRole: "artisanal_miner", effects: { advisorBoost: 1 } },
  { key: "energy_boost", category: "consumable", label: "Energy Drink Crate", labelFr: "Caisse énergie", costMcb: 6, minRole: "artisanal_miner", effects: { energyRestore: 40 } },
];

export const ENERGY = {
  mineCost: 8,
  transportCost: 12,
  tradeCost: 4,
  regenPerHour: 10,
  maxCap: 150,
};

export const STARTER = {
  mcbBalance: 25,
  energy: 100,
  sites: [
    { siteKey: "site_katanga_1", name: "Kasulo Artisan Pit", mineralKey: "cobalt" as MineralKey, richness: 0.55 },
    { siteKey: "site_katanga_2", name: "Lubumbashi Copper Outcrop", mineralKey: "copper" as MineralKey, richness: 0.48 },
  ],
};

export const AI_PERSONALITIES = [
  { key: "kinshasa", name: "McB AI Kinshasa", precision: 0.55, aggression: 0.4, spinStyle: "balanced" },
  { key: "kivu", name: "McB AI Kivu", precision: 0.65, aggression: 0.55, spinStyle: "aggressive" },
  { key: "phantom", name: "McB AI Phantom", precision: 0.75, aggression: 0.35, spinStyle: "defensive" },
  { key: "master", name: "McB AI Master", precision: 0.85, aggression: 0.5, spinStyle: "tactical" },
  { key: "shark", name: "McB AI Shark", precision: 0.9, aggression: 0.8, spinStyle: "aggressive" },
  { key: "legend", name: "McB AI Legend", precision: 0.95, aggression: 0.6, spinStyle: "perfect" },
] as const;
