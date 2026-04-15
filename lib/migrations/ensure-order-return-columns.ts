import { sql } from "@/lib/database"

export async function ensureOrderReturnColumns() {
  await sql`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS return_reason TEXT,
      ADD COLUMN IF NOT EXISTS return_rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS return_processed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS return_processed_by TEXT;
  `
}
