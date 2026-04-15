import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { currentUser } from "@clerk/nextjs/server"
import nodemailer from "nodemailer"
import { ensureOrderReturnColumns } from "@/lib/migrations/ensure-order-return-columns"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")
const RETURN_WINDOW_DAYS = 7

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

async function getUserFromToken() {
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
    }
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

async function sendAdminReturnRequestEmail(order: any, reason: string) {
  try {
    const adminEmail = process.env.ORDER_ALERT_MAIL || "sabsorder@gmail.com"
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `Return Request: Order ${order.order_number || `#${order.id}`}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; line-height: 1.5;">
          <h2 style="color:#dc2626;">Return Request Received</h2>
          <p><strong>Order:</strong> ${order.order_number || order.id}</p>
          <p><strong>Customer:</strong> ${order.customer_name}</p>
          <p><strong>Phone:</strong> ${order.customer_phone || "-"}</p>
          <p><strong>Email:</strong> ${order.customer_email || "-"}</p>
          <p><strong>Delivered At:</strong> ${order.updated_at ? new Date(order.updated_at).toLocaleString() : "-"}</p>
          <p><strong>Reason:</strong></p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
            ${reason || "No reason provided"}
          </div>
          <p style="margin-top: 16px;">Please review in admin orders and set status to <strong>return_successful</strong> or <strong>return_rejected</strong>.</p>
        </div>
      `,
    }
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error("Failed to send return request email:", error)
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orderId = Number(params.id)
    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const payload = await request.json().catch(() => ({}))
    const reason = typeof payload.reason === "string" ? payload.reason.trim() : ""

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50),
        user_id TEXT,
        clerk_user_id TEXT,
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        status VARCHAR(30) DEFAULT 'pending',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await ensureOrderReturnColumns()

    const linkedUserId = await findLinkedUser(user.email, user.isClerkUser)

    const matchingOrders = user.isClerkUser
      ? await sql`
          SELECT * FROM orders
          WHERE id = ${orderId}
            AND (
              clerk_user_id = ${user.userId}
              OR customer_email = ${user.email}
              OR ${linkedUserId ? sql`user_id = ${linkedUserId.toString()}` : sql`false`}
            )
          LIMIT 1
        `
      : await sql`
          SELECT * FROM orders
          WHERE id = ${orderId}
            AND (
              user_id = ${String(user.userId)}
              OR customer_email = ${user.email}
              OR ${linkedUserId ? sql`clerk_user_id = ${linkedUserId}` : sql`false`}
            )
          LIMIT 1
        `

    const order = matchingOrders[0]
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const currentStatus = String(order.status || "").toLowerCase()
    if (["return_requested", "return_successful", "return_rejected"].includes(currentStatus)) {
      return NextResponse.json({ error: "Return already requested/processed for this order" }, { status: 400 })
    }

    if (!["delivered", "completed"].includes(currentStatus)) {
      return NextResponse.json({ error: "Return is only allowed after delivery" }, { status: 400 })
    }

    const deliveredAt = new Date(order.updated_at || order.created_at)
    const now = new Date()
    const daysSinceDelivered = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceDelivered > RETURN_WINDOW_DAYS) {
      return NextResponse.json({ error: "Return window expired (7 days after delivery)" }, { status: 400 })
    }

    const [updated] = await sql`
      UPDATE orders
      SET
        status = 'return_requested',
        return_requested_at = CURRENT_TIMESTAMP,
        return_reason = ${reason || null},
        return_processed_at = NULL,
        return_processed_by = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orderId}
      RETURNING *
    `

    await sendAdminReturnRequestEmail(updated, reason)

    return NextResponse.json({
      success: true,
      message: "Return request submitted successfully",
      order: updated,
    })
  } catch (error) {
    console.error("Error creating return request:", error)
    return NextResponse.json(
      { error: "Failed to request return", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
