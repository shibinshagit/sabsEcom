import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { ensureProductReviewsTable } from "@/lib/migrations/ensure-product-reviews-table"

export async function GET() {
  try {
    await ensureProductReviewsTable()

    const reviews = await sql`
      SELECT
        pr.id,
        pr.product_id,
        p.name AS product_name,
        pr.order_id,
        pr.customer_name,
        pr.user_email,
        pr.rating,
        pr.review_text,
        pr.is_visible,
        pr.is_approved,
        pr.created_at,
        pr.updated_at
      FROM product_reviews pr
      LEFT JOIN products p ON p.id = pr.product_id
      ORDER BY pr.created_at DESC
      LIMIT 300
    `

    return NextResponse.json(reviews)
  } catch (error) {
    console.error("Error fetching admin reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
