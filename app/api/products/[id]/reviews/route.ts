import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { currentUser } from "@clerk/nextjs/server"
import { ensureProductReviewsTable } from "@/lib/migrations/ensure-product-reviews-table"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

type AuthUser = {
  userId: string | number
  email: string
  isClerkUser: boolean
}

async function getUserFromToken(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as number, email: payload.email as string, isClerkUser: false }
  } catch {
    return null
  }
}

async function getAuthenticatedUser() {
  const clerkUser = await currentUser()
  if (clerkUser) {
    return {
      userId: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "",
      isClerkUser: true,
    } satisfies AuthUser
  }

  return await getUserFromToken()
}

async function findLinkedUser(email: string, isClerkUser: boolean) {
  try {
    if (isClerkUser) {
      const manualUser = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
      return manualUser.length > 0 ? manualUser[0].id : null
    }

    const clerkOrders = await sql`
      SELECT DISTINCT clerk_user_id FROM orders
      WHERE customer_email = ${email} AND clerk_user_id IS NOT NULL
      LIMIT 1
    `
    return clerkOrders.length > 0 ? clerkOrders[0].clerk_user_id : null
  } catch {
    return null
  }
}

async function getPurchaseInfo(productId: number, user: AuthUser) {
  const linkedUserId = await findLinkedUser(user.email, user.isClerkUser)

  const matches = user.isClerkUser
    ? await sql`
        SELECT o.id
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.menu_item_id = ${productId}
          AND LOWER(COALESCE(o.status, '')) IN (
            'confirmed', 'packed', 'dispatched', 'out for delivery', 'delivered',
            'return_requested', 'return_successful', 'return_rejected', 'completed'
          )
          AND (
            o.clerk_user_id = ${user.userId}
            OR o.customer_email = ${user.email}
            OR ${linkedUserId ? sql`o.user_id = ${linkedUserId.toString()}` : sql`false`}
          )
        ORDER BY o.created_at DESC
        LIMIT 1
      `
    : await sql`
        SELECT o.id
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.menu_item_id = ${productId}
          AND LOWER(COALESCE(o.status, '')) IN (
            'confirmed', 'packed', 'dispatched', 'out for delivery', 'delivered',
            'return_requested', 'return_successful', 'return_rejected', 'completed'
          )
          AND (
            o.user_id = ${String(user.userId)}
            OR o.customer_email = ${user.email}
            OR ${linkedUserId ? sql`o.clerk_user_id = ${linkedUserId}` : sql`false`}
          )
        ORDER BY o.created_at DESC
        LIMIT 1
      `

  return {
    hasPurchased: matches.length > 0,
    orderId: matches.length > 0 ? matches[0].id : null,
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const productId = Number(id)
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    await ensureProductReviewsTable()

    const [stats] = await sql`
      SELECT
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average_rating,
        COUNT(*)::int AS review_count
      FROM product_reviews
      WHERE product_id = ${productId}
        AND is_visible = TRUE
        AND is_approved = TRUE
    `

    const reviews = await sql`
      SELECT
        id,
        rating,
        review_text,
        customer_name,
        user_email,
        created_at
      FROM product_reviews
      WHERE product_id = ${productId}
        AND is_visible = TRUE
        AND is_approved = TRUE
      ORDER BY created_at DESC
      LIMIT 50
    `

    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({
        average_rating: Number(stats?.average_rating || 0),
        review_count: Number(stats?.review_count || 0),
        reviews,
        can_review: false,
        has_purchased: false,
        user_review: null,
      })
    }

    const purchaseInfo = await getPurchaseInfo(productId, user)
    const ownReview = user.isClerkUser
      ? await sql`
          SELECT id, rating, review_text, is_approved, created_at
          FROM product_reviews
          WHERE product_id = ${productId}
            AND (
              clerk_user_id = ${user.userId}
              OR user_email = ${user.email}
            )
          ORDER BY created_at DESC
          LIMIT 1
        `
      : await sql`
          SELECT id, rating, review_text, is_approved, created_at
          FROM product_reviews
          WHERE product_id = ${productId}
            AND (
              user_id = ${String(user.userId)}
              OR user_email = ${user.email}
            )
          ORDER BY created_at DESC
          LIMIT 1
        `

    return NextResponse.json({
      average_rating: Number(stats?.average_rating || 0),
      review_count: Number(stats?.review_count || 0),
      reviews,
      can_review: purchaseInfo.hasPurchased,
      has_purchased: purchaseInfo.hasPurchased,
      user_review: ownReview[0] || null,
    })
  } catch (error) {
    console.error("Error loading product reviews:", error)
    return NextResponse.json(
      { error: "Failed to load reviews", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const productId = Number(id)
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const rating = Number(body?.rating)
    const reviewText = typeof body?.review_text === "string" ? body.review_text.trim() : ""

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    if (reviewText.length > 1000) {
      return NextResponse.json({ error: "Review must be at most 1000 characters" }, { status: 400 })
    }

    await ensureProductReviewsTable()
    const purchaseInfo = await getPurchaseInfo(productId, user)

    if (!purchaseInfo.hasPurchased || !purchaseInfo.orderId) {
      return NextResponse.json({ error: "Only customers who purchased this product can review it" }, { status: 403 })
    }

    const [profile] = user.isClerkUser
      ? await sql`SELECT name FROM users WHERE email = ${user.email} LIMIT 1`
      : await sql`SELECT name FROM users WHERE id = ${String(user.userId)} LIMIT 1`

    const customerName = profile?.name || user.email.split("@")[0] || "Customer"

    const existing = user.isClerkUser
      ? await sql`
          SELECT id
          FROM product_reviews
          WHERE product_id = ${productId}
            AND (clerk_user_id = ${user.userId} OR user_email = ${user.email})
          LIMIT 1
        `
      : await sql`
          SELECT id
          FROM product_reviews
          WHERE product_id = ${productId}
            AND (user_id = ${String(user.userId)} OR user_email = ${user.email})
          LIMIT 1
        `

    const [review] =
      existing.length > 0
        ? await sql`
            UPDATE product_reviews
            SET
              rating = ${rating},
              review_text = ${reviewText},
              order_id = ${purchaseInfo.orderId},
              customer_name = ${customerName},
              is_approved = FALSE,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existing[0].id}
            RETURNING id, product_id, rating, review_text, customer_name, created_at, updated_at
          `
        : await sql`
            INSERT INTO product_reviews (
              product_id,
              order_id,
              user_id,
              clerk_user_id,
              user_email,
              customer_name,
              rating,
              review_text,
              is_visible,
              is_approved
            ) VALUES (
              ${productId},
              ${purchaseInfo.orderId},
              ${user.isClerkUser ? null : String(user.userId)},
              ${user.isClerkUser ? user.userId : null},
              ${user.email || null},
              ${customerName},
              ${rating},
              ${reviewText},
              TRUE,
              FALSE
            )
            RETURNING id, product_id, rating, review_text, customer_name, created_at, updated_at
          `

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Error creating product review:", error)
    return NextResponse.json(
      { error: "Failed to save review", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
