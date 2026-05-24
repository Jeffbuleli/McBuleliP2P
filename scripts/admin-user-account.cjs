#!/usr/bin/env node
/**
 * Super-admin ops — lookup users, reset password, retire duplicate account.
 *
 * Usage (from repo root, .env.render with DATABASE_URL):
 *   node scripts/admin-user-account.cjs lookup user@gmail.com
 *   node scripts/admin-user-account.cjs lookup pro@company.com
 *   node scripts/admin-user-account.cjs set-password <userId> 'NewSecurePass123!'
 *   node scripts/admin-user-account.cjs retire <userId> --confirm
 *   node scripts/admin-user-account.cjs lookup-id <userId>
 *   node scripts/admin-user-account.cjs transfer-kyc <sourceUserId> <targetUserId> --confirm
 *
 * retire: renames email to retired+<uuid>@deleted.mcbuleli.org and invalidates password
 *         (safer than DELETE when the row has history). Use only on empty duplicate accounts.
 *
 * transfer-kyc: move approved KYC (users row + kyc_sessions + kyc_results) from source → target.
 *               Use when the approved account was retired by mistake (Gmail → pro).
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const postgres = require("postgres");

const envPath = path.join(process.cwd(), ".env.render");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL missing — set in .env.render");
  process.exit(1);
}

const sql = postgres(dbUrl, { max: 1 });

function maskDbUrl(url) {
  try {
    const u = new URL(url.replace(/^postgres:/, "postgresql:"));
    const host = u.hostname || "?";
    const db = (u.pathname || "").replace(/^\//, "") || "?";
    return `${host} / ${db}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

async function dbInfo() {
  console.log("DATABASE:", maskDbUrl(dbUrl));
  const [counts] = await sql`
    SELECT
      (SELECT count(*)::int FROM users) AS users,
      (SELECT count(*)::int FROM users WHERE email LIKE 'retired+%@deleted.mcbuleli.org') AS retired_users,
      (SELECT count(*)::int FROM kyc_sessions) AS kyc_sessions,
      (SELECT count(*)::int FROM kyc_results) AS kyc_results
  `;
  console.log("Counts:", counts);
}

async function lookup(email) {
  const rows = await sql`
    SELECT id, email, role, kyc_status, balance, pi_balance, usd_balance, cdf_balance,
           email_verified_at, created_at, didit_session_id
    FROM users
    WHERE lower(email) = lower(${email})
  `;
  if (rows.length === 0) {
    console.log("No user for:", email);
    return;
  }
  for (const u of rows) {
    console.log(JSON.stringify(u, null, 2));
  }
}

async function setPassword(userId, password) {
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const rows = await sql`
    UPDATE users
    SET password_hash = ${hash}, session_version = session_version + 1
    WHERE id = ${userId}::uuid
    RETURNING id, email, kyc_status
  `;
  if (rows.length === 0) {
    console.error("User not found:", userId);
    process.exit(1);
  }
  console.log("Password updated + sessions invalidated:", rows[0]);
  console.log("Exact email for login:", rows[0].email);
  const ok = await bcrypt.compare(password, hash);
  console.log("passwordMatch (immediate verify):", ok);
  if (!ok) {
    console.error("Hash mismatch — contact dev; re-run set-password.");
  }
}

async function verifyLogin(email, password) {
  const [user] = await sql`
    SELECT id, email, role, kyc_status, password_hash
    FROM users
    WHERE lower(email) = lower(${email.trim()})
    LIMIT 1
  `;
  if (!user) {
    console.log("No user for email:", email);
    return;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  console.log(
    JSON.stringify(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        kyc_status: user.kyc_status,
        passwordMatch: ok,
      },
      null,
      2,
    ),
  );
  if (!ok) {
    console.log("→ Re-run set-password with the password you intend to use.");
    console.log('  Example: set-password', user.id, "'MyPass1234'");
  }
}

async function retire(userId, confirm) {
  if (!confirm) {
    console.error("Add --confirm to retire this user");
    process.exit(1);
  }
  const [u] = await sql`
    SELECT id, email, role, kyc_status,
           balance::text, pi_balance::text, usd_balance::text, cdf_balance::text
    FROM users WHERE id = ${userId}::uuid
  `;
  if (!u) {
    console.error("User not found");
    process.exit(1);
  }
  if (u.role === "super_admin") {
    console.error(
      "Cannot retire super_admin (Gmail owner account). Use transfer-kyc or approve-kyc-manual on PRO instead.",
    );
    process.exit(1);
  }
  const bal =
    Number(u.balance) + Number(u.pi_balance) + Number(u.usd_balance) + Number(u.cdf_balance);
  if (bal > 0) {
    console.error("User has non-zero balance — do not retire. Transfer funds first.");
    process.exit(1);
  }
  if (u.kyc_status === "approved") {
    console.error("User is KYC approved — retire the OTHER duplicate account instead.");
    process.exit(1);
  }
  const retiredEmail = `retired+${u.id}@deleted.mcbuleli.org`;
  const hash = await bcrypt.hash(crypto.randomUUID(), 12);
  const rows = await sql`
    UPDATE users
    SET email = ${retiredEmail},
        password_hash = ${hash},
        session_version = session_version + 1,
        pending_email = null,
        didit_session_id = null,
        didit_session_status = null,
        kyc_status = 'none'
    WHERE id = ${userId}::uuid
    RETURNING id, email
  `;
  console.log("Retired:", rows[0]);
  console.log("Original email was:", u.email);
}

async function lookupId(userId) {
  const [u] = await sql`
    SELECT id, email, role, kyc_status, kyc_updated_at,
           legal_first_name, legal_last_name, birth_date,
           document_number, document_type, document_country,
           didit_session_id, didit_session_status, kyc_portrait_url,
           balance::text, pi_balance::text, usd_balance::text, cdf_balance::text,
           email_verified_at, created_at
    FROM users WHERE id = ${userId}::uuid
  `;
  if (!u) {
    console.log("No user for id:", userId);
    return;
  }
  console.log("User:", JSON.stringify(u, null, 2));
  const sessions = await sql`
    SELECT id, didit_session_id, status, completed_at, created_at
    FROM kyc_sessions WHERE user_id = ${userId}::uuid
    ORDER BY completed_at DESC NULLS LAST, created_at DESC
  `;
  console.log("kyc_sessions:", sessions.length ? sessions : "(none)");
  const results = await sql`
    SELECT id, outcome, decided_at, session_id
    FROM kyc_results WHERE user_id = ${userId}::uuid
    ORDER BY decided_at DESC
  `;
  console.log("kyc_results:", results.length ? results : "(none)");
}

const APPROVED_DIDIT = new Set(["Approved", "approved"]);

/** List retired accounts (with or without kyc_sessions). */
async function findRetiredKyc() {
  console.log("DATABASE:", maskDbUrl(dbUrl));
  const retired = await sql`
    SELECT id, email, role, kyc_status, kyc_updated_at,
           legal_first_name, legal_last_name,
           didit_session_id, didit_session_status,
           balance::text, pi_balance::text, usd_balance::text, cdf_balance::text,
           created_at
    FROM users
    WHERE email LIKE 'retired+%@deleted.mcbuleli.org'
       OR email LIKE 'retired+%'
    ORDER BY kyc_updated_at DESC NULLS LAST, created_at DESC
    LIMIT 30
  `;
  if (retired.length === 0) {
    console.log("No retired+* users in this database.");
    console.log("→ Check .env.render points to PROD (Render External URL), not local.");
    return;
  }
  console.log(`Retired accounts (${retired.length}):`);
  for (const u of retired) {
    const [sess] = await sql`
      SELECT count(*)::int AS n FROM kyc_sessions WHERE user_id = ${u.id}::uuid
    `;
    const [res] = await sql`
      SELECT count(*)::int AS n FROM kyc_results WHERE user_id = ${u.id}::uuid
    `;
    console.log(
      JSON.stringify({
        id: u.id,
        email: u.email,
        kyc_status: u.kyc_status,
        legal: [u.legal_first_name, u.legal_last_name].filter(Boolean).join(" ") || null,
        didit_session_id: u.didit_session_id,
        kyc_sessions: sess.n,
        kyc_results: res.n,
        balances: {
          usdt: u.balance,
          pi: u.pi_balance,
          usd: u.usd_balance,
          cdf: u.cdf_balance,
        },
      }),
    );
  }
  console.log("\nPick Gmail retired row id as SOURCE for transfer-kyc.");
}

/** Any user with approved KYC history (for recovery when retire pattern missing). */
async function scanKycApproved() {
  console.log("DATABASE:", maskDbUrl(dbUrl));
  const fromResults = await sql`
    SELECT DISTINCT u.id, u.email, u.role, u.kyc_status, kr.outcome, kr.decided_at
    FROM kyc_results kr
    JOIN users u ON u.id = kr.user_id
    WHERE lower(kr.outcome) IN ('approved', 'verified')
    ORDER BY kr.decided_at DESC
    LIMIT 20
  `;
  const fromSessions = await sql`
    SELECT DISTINCT u.id, u.email, u.role, u.kyc_status, ks.status, ks.didit_session_id, ks.completed_at
    FROM kyc_sessions ks
    JOIN users u ON u.id = ks.user_id
    WHERE ks.status IN ('Approved', 'approved')
    ORDER BY ks.completed_at DESC NULLS LAST
    LIMIT 20
  `;
  console.log("kyc_results approved:", fromResults.length ? fromResults : "(none)");
  console.log("kyc_sessions Approved:", fromSessions.length ? fromSessions : "(none)");
  const withLegal = await sql`
    SELECT id, email, role, kyc_status, legal_first_name, legal_last_name, kyc_updated_at
    FROM users
    WHERE (legal_first_name IS NOT NULL OR legal_last_name IS NOT NULL)
    ORDER BY kyc_updated_at DESC NULLS LAST
    LIMIT 15
  `;
  console.log("users with legal name (OCR):", withLegal.length ? withLegal : "(none)");
}

async function transferKyc(sourceId, targetId, confirm) {
  if (!confirm) {
    console.error("Add --confirm to transfer KYC");
    process.exit(1);
  }
  if (sourceId === targetId) {
    console.error("source and target must differ");
    process.exit(1);
  }

  const [source] = await sql`
    SELECT id, email, role, kyc_status,
           legal_first_name, legal_last_name, birth_date,
           document_number, document_type, document_country,
           didit_session_id, didit_session_status, kyc_portrait_url, kyc_updated_at
    FROM users WHERE id = ${sourceId}::uuid
  `;
  const [target] = await sql`
    SELECT id, email, role, kyc_status, didit_session_id
    FROM users WHERE id = ${targetId}::uuid
  `;
  if (!source || !target) {
    console.error("source or target user not found");
    process.exit(1);
  }
  if (target.role === "super_admin") {
    console.warn("Target is super_admin — recovery transfer allowed.");
  }
  if (source.role === "super_admin") {
    console.warn("Source is super_admin — KYC data will move to target.");
  }

  const sessions = await sql`
    SELECT id, didit_session_id, status, completed_at, raw_decision
    FROM kyc_sessions
    WHERE user_id = ${sourceId}::uuid
    ORDER BY completed_at DESC NULLS LAST, created_at DESC
  `;
  const approvedResults = await sql`
    SELECT session_id, outcome, decided_at
    FROM kyc_results
    WHERE user_id = ${sourceId}::uuid
      AND lower(outcome) IN ('approved', 'verified')
    ORDER BY decided_at DESC
    LIMIT 1
  `;

  let session =
    sessions.find((s) => APPROVED_DIDIT.has((s.status ?? "").trim())) ?? null;
  if (!session && approvedResults.length > 0) {
    const sid = approvedResults[0].session_id;
    session = sessions.find((s) => s.id === sid) ?? sessions[0] ?? null;
  }
  if (!session && sessions.length > 0) {
    session = sessions[0];
  }

  const diditSessionId =
    session?.didit_session_id?.trim() ||
    source.didit_session_id?.trim() ||
    null;
  const diditSessionStatus =
    session?.status?.trim() || source.didit_session_status?.trim() || "Approved";

  const canManualApprove =
    !diditSessionId &&
    (source.legal_first_name ||
      source.legal_last_name ||
      approvedResults.length > 0 ||
      source.kyc_updated_at);

  if (!diditSessionId && !canManualApprove) {
    console.error("No Didit session or legal identity on source.");
    console.error("Try: scan-kyc-approved  and  lookup-id <gmail-uuid>");
    process.exit(1);
  }

  if (!diditSessionId) {
    console.warn("No didit_session_id — approving target from legal/OCR data only.");
  }

  const hasApprovedProof =
    APPROVED_DIDIT.has(diditSessionStatus) ||
    source.kyc_status === "approved" ||
    approvedResults.length > 0 ||
    sessions.some((s) => APPROVED_DIDIT.has((s.status ?? "").trim()));

  if (!hasApprovedProof) {
    console.warn(
      "Warning: no explicit Approved session — proceeding with best session:",
      diditSessionId,
      diditSessionStatus,
    );
  }

  console.log("Transfer plan:");
  console.log("  FROM:", source.email, source.id);
  console.log("  TO:  ", target.email, target.id);
  console.log(
    "  Didit session:",
    diditSessionId || "(manual)",
    diditSessionStatus,
  );

  await sql.begin(async (tx) => {
    await tx`
      UPDATE users
      SET kyc_status = 'approved',
          kyc_updated_at = coalesce(${source.kyc_updated_at}, now()),
          kyc_rejection_note = null,
          didit_session_id = ${diditSessionId},
          didit_session_status = ${diditSessionId ? diditSessionStatus : null},
          legal_first_name = coalesce(${source.legal_first_name}, legal_first_name),
          legal_last_name = coalesce(${source.legal_last_name}, legal_last_name),
          birth_date = coalesce(${source.birth_date}, birth_date),
          document_number = coalesce(${source.document_number}, document_number),
          document_type = coalesce(${source.document_type}, document_type),
          document_country = coalesce(${source.document_country}, document_country),
          kyc_portrait_url = coalesce(${source.kyc_portrait_url}, kyc_portrait_url),
          session_version = session_version + 1
      WHERE id = ${targetId}::uuid
    `;
    await tx`
      UPDATE kyc_sessions SET user_id = ${targetId}::uuid
      WHERE user_id = ${sourceId}::uuid
    `;
    await tx`
      UPDATE kyc_results SET user_id = ${targetId}::uuid
      WHERE user_id = ${sourceId}::uuid
    `;
    await tx`
      UPDATE users
      SET kyc_status = 'none',
          didit_session_id = null,
          didit_session_status = null,
          session_version = session_version + 1
      WHERE id = ${sourceId}::uuid
    `;
  });

  const [after] = await sql`
    SELECT id, email, kyc_status, didit_session_id, didit_session_status,
           legal_first_name, legal_last_name
    FROM users WHERE id = ${targetId}::uuid
  `;
  console.log("KYC transferred. Target now:", JSON.stringify(after, null, 2));
  console.log("Log in with:", target.email);
}

/** Manual KYC approve on one account (both super_admin OK). */
async function approveKycManual(userId, confirm) {
  if (!confirm) {
    console.error("Add --confirm to approve KYC manually");
    process.exit(1);
  }
  const [u] = await sql`
    SELECT id, email, role, kyc_status FROM users WHERE id = ${userId}::uuid
  `;
  if (!u) {
    console.error("User not found");
    process.exit(1);
  }
  const rows = await sql`
    UPDATE users
    SET kyc_status = 'approved',
        kyc_updated_at = now(),
        kyc_rejection_note = null,
        session_version = session_version + 1
    WHERE id = ${userId}::uuid
    RETURNING id, email, role, kyc_status
  `;
  console.log("KYC manually approved:", rows[0]);
  if (u.role === "super_admin") {
    console.warn("super_admin account — use only for owner recovery.");
  }
}

async function main() {
  const [cmd, arg1, arg2, ...rest] = process.argv.slice(2);
  const confirm = rest.includes("--confirm");

  if (cmd === "lookup") {
    if (!arg1) {
      console.error("Usage: lookup <email>");
      process.exit(1);
    }
    await lookup(arg1.trim());
  } else if (cmd === "verify-login") {
    if (!arg1 || !arg2) {
      console.error("Usage: verify-login <email> '<password>'");
      process.exit(1);
    }
    await verifyLogin(arg1.trim(), arg2);
  } else if (cmd === "set-password") {
    if (!arg1 || !arg2) {
      console.error("Usage: set-password <userId> '<password>'");
      process.exit(1);
    }
    await setPassword(arg1, arg2);
  } else if (cmd === "retire") {
    if (!arg1) {
      console.error("Usage: retire <userId> --confirm");
      process.exit(1);
    }
    await retire(arg1, confirm);
  } else if (cmd === "lookup-id") {
    if (!arg1) {
      console.error("Usage: lookup-id <userId>");
      process.exit(1);
    }
    await lookupId(arg1.trim());
  } else if (cmd === "db-info") {
    await dbInfo();
  } else if (cmd === "find-retired-kyc") {
    await findRetiredKyc();
  } else if (cmd === "scan-kyc-approved") {
    await scanKycApproved();
  } else if (cmd === "approve-kyc-manual") {
    if (!arg1) {
      console.error("Usage: approve-kyc-manual <userId> --confirm");
      process.exit(1);
    }
    await approveKycManual(arg1.trim(), confirm);
  } else if (cmd === "transfer-kyc") {
    if (!arg1 || !arg2) {
      console.error("Usage: transfer-kyc <sourceUserId> <targetUserId> --confirm");
      process.exit(1);
    }
    await transferKyc(arg1.trim(), arg2.trim(), confirm);
  } else {
    console.log(`Commands: db-info | lookup | lookup-id | find-retired-kyc | scan-kyc-approved
  set-password | verify-login | transfer-kyc | approve-kyc-manual | retire

super_admin: retire is blocked; transfer-kyc and approve-kyc-manual are allowed.
See docs/kyc-account-merge.md`);
    process.exit(cmd ? 1 : 0);
  }

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
