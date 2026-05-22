import { getLastClosureReport } from "@/lib/avec/group-cycle-closure";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await getLastClosureReport({ groupId: id, userId });
  if (!r.ok) {
    return new Response(r.message, { status: r.message === "group_forbidden" ? 403 : 404 });
  }

  const { groupName, cycleNumber, executedAt, snapshot } = r;
  const loc = "fr-FR";
  const dateStr = new Date(executedAt).toLocaleString(loc);

  const rows = snapshot.members
    .map(
      (m) =>
        `<tr>
          <td>${esc(m.displayName)}</td>
          <td class="num">${m.sharesTotal}</td>
          <td class="num">${m.contributedUsdt.toFixed(2)}</td>
          <td class="num">${m.payoutUsdt.toFixed(2)}</td>
          <td class="num">${m.gainUsdt >= 0 ? "+" : ""}${m.gainUsdt.toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${esc(groupName)} — Cycle ${cycleNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #1c1917; }
    h1 { font-size: 1.25rem; }
    .meta { font-size: 0.85rem; color: #57534e; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th, td { border: 1px solid #d6d3d1; padding: 0.4rem 0.5rem; text-align: left; }
    th { background: #f5f5f4; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 1rem; font-size: 0.85rem; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: #78716c; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${esc(groupName)} — Clôture cycle ${cycleNumber}</h1>
  <p class="meta">Exécutée le ${esc(dateStr)} · McBuleli AVEC</p>
  <div class="totals">
    <p><strong>Parts totales :</strong> ${snapshot.totalShares}</p>
    <p><strong>Valeur finale / part :</strong> ${snapshot.finalShareValueUsdt.toFixed(4)} USDT</p>
    <p><strong>Distribué (fonds épargne) :</strong> ${snapshot.distributableUsdt.toFixed(2)} USDT</p>
    <p><strong>Réserve solidarité (conservée) :</strong> ${snapshot.socialUsdt.toFixed(2)} USDT</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Membre</th>
        <th class="num">Parts</th>
        <th class="num">Cotisé</th>
        <th class="num">Reçu</th>
        <th class="num">Gain</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>Powered by McBuleli · Document généré pour archivage — imprimer en PDF via le navigateur.</footer>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
