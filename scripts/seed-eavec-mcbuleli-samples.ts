/**
 * Seed sample Marché products for McBuleli (ceo@mcbuleli.org).
 * Idempotent by title prefix "McBuleli · ".
 *
 *   npx tsx scripts/seed-eavec-mcbuleli-samples.ts
 *
 * Requires DATABASE_URL. Sets listings to status=available (skip ops review).
 * Images: verified Unsplash HTTPS (allowed in CSP img-src).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { and, eq } from "drizzle-orm";
import { getDb, eavecMarketListings, users } from "../src/db";
import type { EavecMarketCategory } from "../src/lib/eavec-market/categories";

function loadLocalEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    loadEnvFile(envPath);
  } catch {
    /* already loaded */
  }
}

loadLocalEnv();

const SELLER_EMAIL = "ceo@mcbuleli.org";
const TITLE_PREFIX = "McBuleli · ";
const LOCATION = "Kinshasa · Gombe - McBuleli HQ";

type Sample = {
  title: string;
  description: string;
  category: EavecMarketCategory;
  price: number;
  quantity: number;
  kind: "product" | "service";
  imageUrl: string;
};

/** HD Unsplash URLs verified HTTP 200 (w=1200). */
const SAMPLES: Sample[] = [
  {
    title: "Tomates fraîches du plateau",
    description:
      "Récolte locale sélectionnée par McBuleli. Tomates fermes, idéales cuisine & marchés. Qualité contrôlée, emballage soigné.",
    category: "agriculture",
    price: 8500,
    quantity: 12,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Manioc frais en lots",
    description:
      "Manioc blanc premium - filière McBuleli. Lots de 5 kg, livraison Kinshasa possible. Produit communautaire vérifié.",
    category: "agriculture",
    price: 12000,
    quantity: 8,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Café arabica torréfié RDC",
    description:
      "Café McBuleli - grains arabica Kivu, torréfaction moyenne. Paquet 250 g. Arôme riche pour bureaux & foyers.",
    category: "food",
    price: 18500,
    quantity: 15,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Huile de palme artisanale",
    description:
      "Huile rouge artisanale conditionnée par McBuleli. Bidon 1 L, goût authentique. Idéale sauces & fritures.",
    category: "food",
    price: 9500,
    quantity: 10,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Pagne wax premium 6 yards",
    description:
      "Wax hollandais motifs exclusifs - collection McBuleli Mode. Tissu 6 yards, couleurs vives, prêt couture.",
    category: "fashion",
    price: 45000,
    quantity: 7,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Sneakers urbaines unisexes",
    description:
      "Baskets confort McBuleli Store. Pointures 38-44, semelle souple. Style ville Kinshasa, neuf emballé.",
    category: "fashion",
    price: 65000,
    quantity: 9,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Conseil digital & e-commerce",
    description:
      "Service McBuleli : audit boutique en ligne, paiement Fc, formation équipe. Forfait demi-journée à Kinshasa ou visio.",
    category: "services",
    price: 150000,
    quantity: 5,
    kind: "service",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Installation Wi-Fi PME",
    description:
      "McBuleli Tech : câblage & config routeur pour petits commerces. Inclut test débit et briefing équipe (Kinshasa).",
    category: "services",
    price: 95000,
    quantity: 6,
    kind: "service",
    imageUrl:
      "https://images.pexels.com/photos/159304/network-cable-ethernet-computer-159304.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Panier tressé décoratif",
    description:
      "Artisanat local sélection McBuleli Maison. Panier tressé XL pour rangement ou déco. Pièce unique soignée.",
    category: "home",
    price: 22000,
    quantity: 11,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Kit cuisine inox 5 pièces",
    description:
      "Ustensiles inox durables - gamme McBuleli Foyer. 5 pièces essentielles, hygiéniques, faciles à nettoyer.",
    category: "home",
    price: 38000,
    quantity: 8,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Lampe solaire portable",
    description:
      "Éclairage solaire McBuleli Energy. Charge USB + panneau. Idéale coupures & déplacements. Autonomie ~8 h.",
    category: "tech",
    price: 42000,
    quantity: 14,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Écouteurs Bluetooth pro",
    description:
      "Audio sans fil McBuleli Tech. Autonomie longue, micro intégré pour appels business. Garantie vendeur McBuleli.",
    category: "tech",
    price: 55000,
    quantity: 10,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Kit bienvenue McBuleli",
    description:
      "Coffret découverte entreprise McBuleli : carnet, sticker, guide Marché e-AVEC. Cadeau partenaires & nouveaux membres.",
    category: "other",
    price: 15000,
    quantity: 13,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=85",
  },
  {
    title: "Sac tote canvas logo",
    description:
      "Tote bag canvas McBuleli - robuste, quotidien bureau/marché. Impression logo, stock limité HQ Gombe.",
    category: "other",
    price: 12000,
    quantity: 15,
    kind: "product",
    imageUrl:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=85",
  },
];

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required");
  }

  const db = getDb();
  const [seller] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.email, SELLER_EMAIL))
    .limit(1);

  if (!seller) {
    throw new Error(`User not found: ${SELLER_EMAIL}`);
  }

  await db
    .update(users)
    .set({
      displayName: "McBuleli",
      kycStatus: "approved",
    })
    .where(eq(users.id, seller.id));

  console.log(
    `Seller ${seller.email} (${seller.id}) → displayName=McBuleli, kyc=approved`,
  );

  let created = 0;
  let updated = 0;

  for (const s of SAMPLES) {
    const title = `${TITLE_PREFIX}${s.title}`.slice(0, 120);
    const description = s.description.slice(0, 300);

    const [existing] = await db
      .select({ id: eavecMarketListings.id })
      .from(eavecMarketListings)
      .where(
        and(
          eq(eavecMarketListings.sellerUserId, seller.id),
          eq(eavecMarketListings.title, title),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(eavecMarketListings)
        .set({
          description,
          category: s.category,
          currency: "CDF",
          price: s.price.toFixed(2),
          quantity: s.quantity,
          locationLabel: LOCATION,
          countryCode: "CD",
          imageUrl: s.imageUrl,
          status: "available",
          kind: s.kind,
          updatedAt: new Date(),
        })
        .where(eq(eavecMarketListings.id, existing.id));
      updated += 1;
      console.log(`↻ ${title}`);
      continue;
    }

    await db.insert(eavecMarketListings).values({
      sellerUserId: seller.id,
      title,
      description,
      category: s.category,
      currency: "CDF",
      price: s.price.toFixed(2),
      quantity: s.quantity,
      locationLabel: LOCATION,
      countryCode: "CD",
      imageUrl: s.imageUrl,
      status: "available",
      kind: s.kind,
    });
    created += 1;
    console.log(`+ ${title}`);
  }

  console.log(
    `\nDone. created=${created} updated=${updated} (sample titles with prefix "${TITLE_PREFIX}")`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
