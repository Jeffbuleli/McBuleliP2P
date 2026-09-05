/**
 * Migrate data/sessions.json → Postgres alert_sessions (+ seed incident_events).
 * Prerequisites: npm run db:push
 * Usage: npm run db:migrate-sessions
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

function numStr(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return String(n);
}

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const dataFile = path.join(root, "data", "sessions.json");
if (!fs.existsSync(dataFile)) {
  console.log("No data/sessions.json - nothing to migrate");
  process.exit(0);
}

const rows = JSON.parse(fs.readFileSync(dataFile, "utf8"));
if (!Array.isArray(rows)) {
  console.error("sessions.json is not an array");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function upsert(record) {
  await sql`
    INSERT INTO alert_sessions (
      id, status, source, anonymous_token, urgency, category, immediate_danger,
      lat, lng, location_label, commune, location_source, location_consent_at,
      message, ai_summary, ai_confidence, ai_payload, routing_queue, auto_route,
      provider, ai_mode, assigned_to, operator_notes, locale, client_ip, user_agent,
      discrete_mode, trusted_contacts, school_context, routing_meta, status_history,
      media, chat_messages, sla_due_at, escalation, record_json,
      created_at, oriented_at, closed_at, updated_at
    ) VALUES (
      ${record.id}::uuid,
      ${record.status},
      ${record.source},
      ${record.citizenToken ?? null},
      ${record.urgency},
      ${record.category ?? null},
      ${Boolean(record.immediateDanger)},
      ${numStr(record.lat)},
      ${numStr(record.lng)},
      ${record.locationLabel ?? null},
      ${record.commune ?? null},
      ${record.locationSource ?? null},
      ${record.locationConsentAt ? new Date(record.locationConsentAt) : null},
      ${record.message ?? null},
      ${record.aiSummary ?? null},
      ${numStr(record.aiConfidence)},
      ${sql.json(record.aiPayload ?? {})},
      ${record.routingQueue ?? null},
      ${Boolean(record.autoRoute)},
      ${record.provider ?? null},
      ${record.aiMode ?? null},
      ${record.assignedTo ?? null},
      ${record.operatorNotes ?? null},
      ${record.locale || "fr"},
      ${record.clientIp ?? null},
      ${record.userAgent ?? null},
      ${Boolean(record.discreteMode)},
      ${sql.json(record.trustedContacts ?? [])},
      ${sql.json(record.schoolContext ?? null)},
      ${sql.json(record.routingMeta ?? null)},
      ${sql.json(record.statusHistory ?? [])},
      ${sql.json(record.media ?? [])},
      ${sql.json(record.chatMessages ?? [])},
      ${record.slaDueAt ? new Date(record.slaDueAt) : null},
      ${sql.json(record.escalation ?? null)},
      ${sql.json(record)},
      ${new Date(record.createdAt)},
      ${record.orientedAt ? new Date(record.orientedAt) : null},
      ${record.closedAt ? new Date(record.closedAt) : null},
      ${new Date()}
    )
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      anonymous_token = EXCLUDED.anonymous_token,
      urgency = EXCLUDED.urgency,
      category = EXCLUDED.category,
      immediate_danger = EXCLUDED.immediate_danger,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      location_label = EXCLUDED.location_label,
      commune = EXCLUDED.commune,
      location_source = EXCLUDED.location_source,
      location_consent_at = EXCLUDED.location_consent_at,
      message = EXCLUDED.message,
      ai_summary = EXCLUDED.ai_summary,
      ai_confidence = EXCLUDED.ai_confidence,
      ai_payload = EXCLUDED.ai_payload,
      routing_queue = EXCLUDED.routing_queue,
      auto_route = EXCLUDED.auto_route,
      provider = EXCLUDED.provider,
      ai_mode = EXCLUDED.ai_mode,
      assigned_to = EXCLUDED.assigned_to,
      operator_notes = EXCLUDED.operator_notes,
      locale = EXCLUDED.locale,
      client_ip = EXCLUDED.client_ip,
      user_agent = EXCLUDED.user_agent,
      discrete_mode = EXCLUDED.discrete_mode,
      trusted_contacts = EXCLUDED.trusted_contacts,
      school_context = EXCLUDED.school_context,
      routing_meta = EXCLUDED.routing_meta,
      status_history = EXCLUDED.status_history,
      media = EXCLUDED.media,
      chat_messages = EXCLUDED.chat_messages,
      sla_due_at = EXCLUDED.sla_due_at,
      escalation = EXCLUDED.escalation,
      record_json = EXCLUDED.record_json,
      oriented_at = EXCLUDED.oriented_at,
      closed_at = EXCLUDED.closed_at,
      updated_at = EXCLUDED.updated_at
  `;

  const existing = await sql`
    SELECT id FROM incident_events WHERE session_id = ${record.id}::uuid LIMIT 1
  `;
  if (existing.length) return;

  const history = Array.isArray(record.statusHistory)
    ? [...record.statusHistory].reverse()
    : [];
  for (const h of history) {
    await sql`
      INSERT INTO incident_events (id, session_id, at, event_type, status, actor, note, payload)
      VALUES (
        ${randomUUID()}::uuid,
        ${record.id}::uuid,
        ${new Date(h.at || record.createdAt)},
        ${"status_change"},
        ${h.status ?? null},
        ${h.actor ?? null},
        ${h.note ?? null},
        ${null}
      )
    `;
  }
}

let ok = 0;
try {
  for (const row of rows) {
    await upsert(row);
    ok += 1;
    console.log("upserted", row.id);
  }
  console.log(JSON.stringify({ migrated: ok }, null, 2));
} finally {
  await sql.end({ timeout: 5 });
}
