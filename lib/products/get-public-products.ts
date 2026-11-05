import { sql } from "@/lib/database"
import { ensureProductReviewsTable } from "@/lib/migrations/ensure-product-reviews-table"

export async function getPublicProducts() {
  await ensureProductReviewsTable()

  const products = await sql`
    SELECT
      p.*,
      c.name AS category_name,
      COALESCE(rs.average_rating, 0) AS average_rating,
      COALESCE(rs.review_count, 0) AS review_count,
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
    LEFT JOIN (
      SELECT
        product_id,
        ROUND(AVG(rating)::numeric, 1) AS average_rating,
        COUNT(*)::int AS review_count
      FROM product_reviews
      WHERE is_visible = TRUE AND is_approved = TRUE
      GROUP BY product_id
    ) rs ON rs.product_id = p.id
    LEFT JOIN product_variants v ON p.id = v.product_id
    WHERE p.is_available = TRUE
    GROUP BY p.id, c.name, c.sort_order, rs.average_rating, rs.review_count
    ORDER BY
      CASE WHEN p.is_featured THEN 0 ELSE 1 END,
      CASE WHEN p.is_new THEN 0 ELSE 1 END,
      c.sort_order,
      c.name,
      p.name
  `

  const plain = JSON.parse(JSON.stringify(products))
  return plain.map((product: { image_urls?: unknown; variants?: unknown; features?: unknown }) => ({
    ...product,
    image_urls: Array.isArray(product.image_urls) ? product.image_urls : [],
    variants: Array.isArray(product.variants) ? product.variants : [],
    features: Array.isArray(product.features) ? product.features : [],
  }))
}
