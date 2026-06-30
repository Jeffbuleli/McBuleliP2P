/** Collect nested error text (postgres.js wraps real PG errors). */
function fullErrorText(error: unknown): string {
  const parts: string[] = [];
  let e: unknown = error;
  let depth = 0;
  while (e && depth < 8) {
    if (e instanceof Error) {
      parts.push(e.message);
      e = e.cause;
    } else {
      parts.push(String(e));
      break;
    }
    depth += 1;
  }
  return parts.join(" ");
}

/** Map server exceptions to a safe user-visible message */
export function friendlyAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  const msg = fullErrorText(error);
  const code = (error as NodeJS.ErrnoException).code;

  if (code === "ECONNREFUSED" || msg.includes("ECONNREFUSED")) {
    return "Cannot connect to PostgreSQL. Start your database (e.g. brew services start postgresql@16) and check DATABASE_URL in .env.";
  }
  if (
    msg.includes("password authentication failed") ||
    msg.includes("28P01")
  ) {
    return "Database login failed: wrong user or password in DATABASE_URL. Update .env.";
  }
  if (msg.includes("does not exist") && msg.toLowerCase().includes("database")) {
    return "Database does not exist. Create it (e.g. createdb mcbuleli) or fix DATABASE_URL.";
  }
  /** Postgres undefined_table — tables never migrated */
  if (
    msg.includes("42P01") ||
    (msg.includes("relation") && msg.includes("does not exist")) ||
    (msg.includes("Failed query") && msg.includes("users"))
  ) {
    return [
      "Database tables are missing for the DATABASE_URL your server uses.",
      "Local: from the project folder run npm run db:push (loads .env).",
      "Deployed (Render): copy DATABASE_URL from the Render dashboard and run once:",
      'DATABASE_URL="…" npx drizzle-kit push — that URL must match production.',
    ].join(" ");
  }
  if (msg.includes("JWT_SECRET")) {
    return "JWT_SECRET is missing or shorter than 16 characters. Set it in .env.";
  }
  if (msg.includes("DATABASE_URL")) {
    return msg;
  }

  return process.env.NODE_ENV === "development"
    ? error.message
    : "Server error. Please try again.";
}
