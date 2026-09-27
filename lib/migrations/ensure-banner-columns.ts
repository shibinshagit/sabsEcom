import { sql } from "@/lib/database"

/**
 * Ensures optional banner columns exist. IF NOT EXISTS keeps this idempotent.
 */
export async function ensureBannerColumns() {
  await sql`
    ALTER TABLE banners
      ADD COLUMN IF NOT EXISTS background_image_url TEXT DEFAULT '' NOT NULL,
      ADD COLUMN IF NOT EXISTS auto_disappear_seconds INTEGER DEFAULT 0 NOT NULL,
      ADD COLUMN IF NOT EXISTS redisplay_after_minutes INTEGER DEFAULT 5 NOT NULL,
      ADD COLUMN IF NOT EXISTS placement VARCHAR(20) DEFAULT 'popup' NOT NULL;
  `
}
