import { emailSubject } from "../src/lib/email/copy";
import { renderResendTemplateHtml } from "../src/lib/email/render-resend-template";
import { MC_BULELI_EMAIL_TEMPLATES } from "../src/lib/email/template-definitions";
import { upsertResendTemplate } from "../src/lib/email/send";

async function main() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.error("Missing RESEND_API_KEY. Run: npm run resend:sync-templates (with .env)");
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
    }
  }

  console.log(`\nDone: ${ok} published, ${fail} failed.`);
  console.log("\nEnsure RESEND_USE_TEMPLATES=true in .env after sync.");

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
