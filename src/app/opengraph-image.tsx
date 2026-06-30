import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";

/** Node runtime: read logo from `public/` so OG works without env URL at generation time. */
export const runtime = "nodejs";

export const alt = "McBuleli — crypto P2P & mobile money";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  let logoSrc: string | null = null;
  try {
    const buf = await readFile(
      join(process.cwd(), "public", "brand", "logo.png"),
    );
    logoSrc = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    // Fallback: no logo file (unlikely in prod).
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a09",
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.25), transparent 55%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
          }}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="McBuleli"
              width={140}
              height={140}
              style={{
                borderRadius: 32,
                boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              }}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 32,
                backgroundColor: "#166534",
                border: "3px solid rgba(16,185,129,0.45)",
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                letterSpacing: -2,
                color: "#fafaf9",
              }}
            >
              McBuleli
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: "#a8a29e",
                maxWidth: 820,
                lineHeight: 1.35,
              }}
            >
              Buy & sell crypto with mobile money — P2P escrow, wallet, Africa.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
