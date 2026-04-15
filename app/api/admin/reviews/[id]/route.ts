import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { ensureProductReviewsTable } from "@/lib/migrations/ensure-product-reviews-table"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureProductReviewsTable()

    const { id } = await params
    const reviewId = Number(id)
    if (!Number.isFinite(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const hasVisible = typeof body.is_visible === "boolean"
    const hasApproved = typeof body.is_approved === "boolean"
    const parsedRating = Number(body.rating)
    const hasRating = Number.isInteger(parsedRating)
    const hasText = typeof body.review_text === "string"

    if (!hasVisible && !hasApproved && !hasRating && !hasText) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    if (hasRating && (parsedRating < 1 || parsedRating > 5)) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const reviewText = hasText ? body.review_text.trim() : null
    if (reviewText && reviewText.length > 1000) {
      return NextResponse.json({ error: "Review text must be at most 1000 characters" }, { status: 400 })
    }

    const [updated] = await sql`
      UPDATE product_reviews
      SET
        is_visible = CASE WHEN ${hasVisible} THEN ${Boolean(body.is_visible)} ELSE is_visible END,
        is_approved = CASE WHEN ${hasApproved} THEN ${Boolean(body.is_approved)} ELSE is_approved END,
        rating = CASE WHEN ${hasRating} THEN ${hasRating ? parsedRating : null} ELSE rating END,
        review_text = CASE WHEN ${hasText} THEN ${reviewText ?? ""} ELSE review_text END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${reviewId}
      RETURNING *
    `

    if (!updated) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json(
      { error: "Failed to update review", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureProductReviewsTable()

    const { id } = await params
    const reviewId = Number(id)
    if (!Number.isFinite(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 })
    }

    const deleted = await sql`DELETE FROM product_reviews WHERE id = ${reviewId} RETURNING id`
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json(
      { error: "Failed to delete review", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
