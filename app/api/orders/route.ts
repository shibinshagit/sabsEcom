
import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { currentUser } from "@clerk/nextjs/server"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

async function getUserFromToken() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as number, email: payload.email as string, isClerkUser: false }
  } catch {
    return null
  }
}

async function getAuthenticatedUser() {
  // First try Clerk authentication
  const clerkUser = await currentUser()
  if (clerkUser) {
    return {
      userId: clerkUser.id, // Clerk user ID is a string
      email: clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || "",
      isClerkUser: true
    }
  }

  // Fallback to manual authentication
  return await getUserFromToken()
}

// Function to link user accounts by email
async function findLinkedUser(email: string, isClerkUser: boolean, userId: string | number) {
  try {
    if (isClerkUser) {
      // For Clerk user, find if there's a manual auth user with same email
      const manualUser = await sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `
      return manualUser.length > 0 ? manualUser[0].id : null
    } else {
      // For manual user, find if there's a Clerk user with same email
      // We'll store this relationship in a new table or use orders to find it
      const clerkOrders = await sql`
        SELECT DISTINCT clerk_user_id FROM orders 
        WHERE customer_email = ${email} AND clerk_user_id IS NOT NULL 
        LIMIT 1
      `
      return clerkOrders.length > 0 ? clerkOrders[0].clerk_user_id : null
    }
  } catch (error) {
    console.error("Error finding linked user:", error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json()
    const user = await getAuthenticatedUser()

    // Validate required fields
    if (!orderData.customerName || !orderData.customerPhone) {
      return NextResponse.json({ error: "Customer name and phone are required" }, { status: 400 })
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 })
    }

    // Calculate totals (no tax)
    const subtotal = orderData.totalAmount || 0
    const deliveryFee = orderData.orderType === "delivery" ? 3.99 : 0
    const finalTotal = subtotal + deliveryFee

    // Generate confirmation code
    const confirmationCode = `ORD${Date.now().toString().slice(-6)}`

    // Ensure tables exist with updated schema
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        clerk_user_id TEXT,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20) NOT NULL,
        order_type VARCHAR(20) DEFAULT 'dine-in',
        table_number INTEGER,
        delivery_address TEXT,
        total_amount DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        final_total DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Add new columns for Clerk support
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS clerk_user_id TEXT,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS final_total DECIMAL(10,2) DEFAULT 0
    `

    // Also modify user_id to TEXT if it was INTEGER
    try {
      await sql`
        ALTER TABLE orders
        ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT
      `
    } catch (e) {
      // Column might already be TEXT, ignore error
    }

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER,
        menu_item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insert order with proper user identification
    const [order] = await sql`
      INSERT INTO orders (
        user_id, clerk_user_id, customer_name, customer_email, customer_phone, 
        order_type, table_number, delivery_address, 
        total_amount, delivery_fee, final_total,
        special_instructions, status
      ) VALUES (
        ${user?.isClerkUser ? null : user?.userId?.toString() || null},
        ${user?.isClerkUser ? user.userId : null},
        ${orderData.customerName}, 
        ${orderData.customerEmail || user?.email || null}, 
        ${orderData.customerPhone},
        ${orderData.orderType || "dine-in"}, 
        ${orderData.tableNumber || null}, 
        ${orderData.deliveryAddress || null},
        ${subtotal}, 
        ${deliveryFee}, 
        ${finalTotal},
        ${orderData.specialInstructions || null},
        'pending'
      ) RETURNING id
    `

    // Insert order items
    for (const item of orderData.items) {
      const totalPrice = item.unitPrice * item.quantity

      await sql`
        INSERT INTO order_items (
          order_id, menu_item_id, menu_item_name, 
          quantity, unit_price, total_price, special_requests
        ) VALUES (
          ${order.id}, 
          ${item.menuItemId}, 
          ${item.menuItemName || "Unknown Item"},
          ${item.quantity}, 
          ${item.unitPrice}, 
          ${totalPrice},
          ${item.specialRequests || null}
        )
      `
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      confirmationCode,
      finalTotal,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    
    // If no authenticated user, return unauthorized
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Authenticated user:", { ...user })

    // Ensure tables exist with updated schema
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        clerk_user_id TEXT,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20) NOT NULL,
        order_type VARCHAR(20) DEFAULT 'dine-in',
        table_number INTEGER,
        delivery_address TEXT,
        total_amount DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        final_total DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Add new columns for Clerk support
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS clerk_user_id TEXT,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS final_total DECIMAL(10,2) DEFAULT 0
    `

    // Also modify user_id to TEXT if it was INTEGER
    try {
      await sql`
        ALTER TABLE orders
        ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT
      `
    } catch (e) {
      // Column might already be TEXT, ignore error
    }

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER,
        menu_item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Find linked user
    const linkedUserId = await findLinkedUser(user.email, user.isClerkUser, user.userId)
    console.log("Linked user ID:", linkedUserId)

    // Get orders for the authenticated user AND linked user (by email)
    let orders
    if (user.isClerkUser) {
      // For Clerk users: get orders by clerk_user_id OR by email OR by linked manual user ID
      orders = await sql`
        SELECT 
          o.*,
          json_agg(
            json_build_object(
              'id', oi.id,
              'menu_item_id', oi.menu_item_id,
              'menu_item_name', oi.menu_item_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'special_requests', oi.special_requests
            ) ORDER BY oi.id
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.clerk_user_id = ${user.userId} 
           OR o.customer_email = ${user.email}
           ${linkedUserId ? sql`OR o.user_id = ${linkedUserId.toString()}` : sql``}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 50
      `
    } else {
      // For manual users: get orders by user_id OR by email OR by linked clerk user ID
      orders = await sql`
        SELECT 
          o.*,
          json_agg(
            json_build_object(
              'id', oi.id,
              'menu_item_id', oi.menu_item_id,
              'menu_item_name', oi.menu_item_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'special_requests', oi.special_requests
            ) ORDER BY oi.id
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ${user.userId.toString()}
           OR o.customer_email = ${user.email}
           ${linkedUserId ? sql`OR o.clerk_user_id = ${linkedUserId}` : sql``}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 50
      `
    }

    console.log(`Found ${orders.length} orders for user ${user.email}`)
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}