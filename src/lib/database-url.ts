/**
 * Normalize DATABASE_URL for the current `pg` driver.
 *
 * `sslmode=require` (and prefer / verify-ca) currently behave like verify-full,
 * but emit a Node security warning. Explicit verify-full matches today's
 * behavior and silences the warning until pg v9 / pg-connection-string v3.
 *
 * Uses a targeted string replace (not `URL`) so password special characters
 * in the connection string are left untouched.
 *
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export function normalizeDatabaseUrl(url: string): string {
  return url.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/i,
    "$1verify-full",
  )
}
