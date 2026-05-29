import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { emailSubject } from "../src/lib/email/copy";
import { renderResendTemplateHtml } from "../src/lib/email/render-resend-template";
import { MC_BULELI_EMAIL_TEMPLATES } from "../src/lib/email/template-definitions";
import { upsertResendTemplate } from "../src/lib/email/send";

function loadLocalEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    loadEnvFile(envPath);
  } catch {
    /* already loaded or invalid */
  }
}

loadLocalEnv();

async function main() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    const envPath = resolve(process.cwd(), ".env");
    console.error("Missing RESEND_API_KEY.");
    console.error(`  cwd: ${process.cwd()}`);
    console.error(`  .env exists: ${existsSync(envPath)} (${envPath})`);
    console.error("  Add RESEND_API_KEY=re_… to .env, then run from repo root:");
    console.error("  npm run resend:sync-templates");
    process.exit(1);
  }

  console.log("Syncing McBuleli email templates to Resend…\n");

  let ok = 0;
  let fail = 0;

  for (const def of MC_BULELI_EMAIL_TEMPLATES) {
    const html = renderResendTemplateHtml({
      kind: def.kind,
      locale: def.locale,
    });
    const subject = emailSubject(def.copyKey, def.locale);
    const name = `McBuleli ${def.kind} (${def.locale})`;

    const out = await upsertResendTemplate({
      alias: def.alias,
      name,
      subject,
      html,
      variables: def.variables,
    });

    if (out.ok) {
      ok++;
      console.log(`✓ ${def.alias}`);
    } else {
      fail++;
      console.error(`✗ ${def.alias}`, out.error);
      if (out.error === "network_error") {
        console.error(
          "  → DNS/réseau local : impossible de joindre api.resend.com (VPN, hors-ligne, pare-feu). Réessayez plus tard.",
        );
      }
    }
  }

  console.log(`\nDone: ${ok} published, ${fail} failed.`);
  if (ok > 0) {
    console.log(
      "\nAperçu Resend mis à jour. En prod, laissez RESEND_USE_TEMPLATES absent ou false — les envois utilisent le HTML inline (images https://mcbuleli.org).",
    );
  }

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
