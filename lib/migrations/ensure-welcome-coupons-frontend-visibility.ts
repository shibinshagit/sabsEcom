import { sql } from "@/lib/database"

export async function ensureWelcomeCouponsFrontendVisibilityColumn() {
  await sql`
    ALTER TABLE welcome_coupons
      ADD COLUMN IF NOT EXISTS show_on_frontend BOOLEAN NOT NULL DEFAULT true
  `
}

