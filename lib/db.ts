import { neon } from "@neondatabase/serverless";

/**
 * Returns a Neon SQL query helper configured from DATABASE_URL.
 */
export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(databaseUrl);
}
