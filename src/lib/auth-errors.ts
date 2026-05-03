/** Map server exceptions to a safe user-visible message */
export function friendlyAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }
  const msg = error.message;
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
  if (msg.includes("does not exist") && msg.includes("database")) {
    return "Database does not exist. Create it (e.g. createdb mcbuleli) or fix DATABASE_URL.";
  }
  if (msg.includes("JWT_SECRET")) {
    return "JWT_SECRET is missing or shorter than 16 characters. Set it in .env.";
  }
  if (msg.includes("DATABASE_URL")) {
    return msg;
  }

  return process.env.NODE_ENV === "development"
    ? msg
    : "Server error. Please try again.";
}
