import { sql } from "@/lib/database"
import { ensureProductReviewsTable } from "@/lib/migrations/ensure-product-reviews-table"

export async function getProductById(id: string) {
  if (!id || Number.isNaN(Number(id))) return null

  await ensureProductReviewsTable()

  const [product] = await sql`
    SELECT
      p.*,
      c.name AS category_name,
      rs.average_rating,
      rs.review_count,
      COALESCE(
        json_agg(
          json_build_object(
            'id', v.id,
            'name', v.name,
            'price_aed', v.price_aed,
            'price_inr', v.price_inr,
            'discount_aed', v.discount_aed,
            'discount_inr', v.discount_inr,
            'available_aed', v.available_aed,
            'available_inr', v.available_inr,
            'stock_quantity', v.stock_quantity,
            'free_delivery_aed', COALESCE(v.free_delivery_aed, false),
            'free_delivery_inr', COALESCE(v.free_delivery_inr, false)
          ) ORDER BY v.id
        ) FILTER (WHERE v.id IS NOT NULL),
        '[]'::json
      ) AS variants
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variants v ON p.id = v.product_id
    LEFT JOIN (
      SELECT
        product_id,
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        COUNT(*)::int AS review_count
      FROM product_reviews
      WHERE is_visible = TRUE AND is_approved = TRUE
      GROUP BY product_id
    ) rs ON rs.product_id = p.id
    WHERE p.id = ${Number(id)}
    GROUP BY p.id, c.name, rs.average_rating, rs.review_count
  `

  if (!product) return null
  const plain = JSON.parse(JSON.stringify(product))
  if (!Array.isArray(plain.image_urls)) plain.image_urls = []
  if (!Array.isArray(plain.variants)) plain.variants = []
  if (!Array.isArray(plain.features)) plain.features = []
  return plain
}
