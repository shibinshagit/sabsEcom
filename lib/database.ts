import { neon } from "@neondatabase/serverless"

/**
 * Neon SQL client – singleton.
 * Falls back to the provided connection string when `DATABASE_URL`
 * isn’t defined in the environment (useful for next-lite preview).
 */
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_0Lp3NVzClRgQ@ep-cold-queen-a83al0eh-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

export const sql = neon(connectionString)
