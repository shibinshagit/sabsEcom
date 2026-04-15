import { sql } from "@/lib/database"

export async function ensureProductReviewsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      order_id INTEGER,
      user_id TEXT,
      clerk_user_id TEXT,
      user_email VARCHAR(255),
      customer_name VARCHAR(255),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review_text TEXT DEFAULT '',
      is_visible BOOLEAN NOT NULL DEFAULT true,
      is_approved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (product_id, user_id, clerk_user_id, user_email)
    )
  `

  await sql`
    ALTER TABLE product_reviews
      ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false
  `

  await sql`
    ALTER TABLE product_reviews
      ALTER COLUMN is_approved SET DEFAULT false
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id
    ON product_reviews(product_id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_product_reviews_lookup
    ON product_reviews(product_id, user_id, clerk_user_id, user_email)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_product_reviews_visibility
    ON product_reviews(product_id, is_visible, is_approved)
  `
}
