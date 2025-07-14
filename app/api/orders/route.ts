import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

async function getUserFromToken() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as number, email: payload.email as string }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json()
    const user = await getUserFromToken()

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

    // Ensure tables exist
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
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

    // Ensure new columns exist on legacy tables
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS user_id INTEGER,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS final_total DECIMAL(10,2) DEFAULT 0
    `

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

    // Insert order
    const [order] = await sql`
      INSERT INTO orders (
        user_id, customer_name, customer_email, customer_phone, 
        order_type, table_number, delivery_address, 
        total_amount, delivery_fee, final_total,
        special_instructions, status
      ) VALUES (
        ${user?.userId || null},
        ${orderData.customerName}, 
        ${orderData.customerEmail || null}, 
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

export async function GET() {
  try {
    // Ensure tables exist
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
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

    // Ensure new columns exist on legacy tables
    await sql`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS user_id INTEGER,
      ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS final_total DECIMAL(10,2) DEFAULT 0
    `

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

    const orders = await sql`
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
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 50
    `

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
