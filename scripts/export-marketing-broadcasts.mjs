#!/usr/bin/env node
/**
 * Export McBuleli marketing broadcast HTML + text for Resend Dashboard.
 * Does NOT send email — writes files to content/email-broadcasts/
 *
 * Usage: npm run resend:export-broadcasts
 * Paste HTML into Resend → Broadcasts → New → HTML (or import).
 * @see docs/email-marketing.md
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "content/email-broadcasts");

// Load compiled TS via tsx dynamic import
const { MC_BULELI_MARKETING_BROADCASTS } = await import(
  "../src/lib/email/marketing-broadcasts.ts"
);
const { renderMarketingBroadcastHtml, renderMarketingBroadcastText } = await import(
  "../src/lib/email/marketing-layout.ts"
);

mkdirSync(outDir, { recursive: true });

const index = [];

for (const def of MC_BULELI_MARKETING_BROADCASTS) {
  const slug = `mcbuleli-${def.kind}-${def.locale}`;
  const html = renderMarketingBroadcastHtml({
    copy: def.copy,
    locale: def.locale,
    resendAudience: true,
  });
  const text = renderMarketingBroadcastText({
    copy: def.copy,
    locale: def.locale,
    resendAudience: true,
  });

  const htmlPath = resolve(outDir, `${slug}.html`);
  const txtPath = resolve(outDir, `${slug}.txt`);
  const metaPath = resolve(outDir, `${slug}.json`);

  writeFileSync(htmlPath, html, "utf8");
  writeFileSync(txtPath, text, "utf8");
  writeFileSync(
    metaPath,
    JSON.stringify(
      {
        name: def.name,
        subject: def.subject,
        kind: def.kind,
        locale: def.locale,
        preheader: def.copy.preheader,
        cta: def.copy.ctaHref,
      },
      null,
      2,
    ),
    "utf8",
  );

  index.push({ slug, name: def.name, subject: def.subject, html: `${slug}.html` });
  console.log(`✓ ${slug}`);
}

writeFileSync(
  resolve(outDir, "index.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), broadcasts: index }, null, 2),
  "utf8",
);

console.log(`\nExported ${index.length} broadcasts → content/email-broadcasts/`);
