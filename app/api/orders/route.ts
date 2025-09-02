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

async function ensureOrdersTableExists() {
  try {
    console.log('Starting database schema setup...')
    
    // Check if orders table already exists with correct schema
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'orders'
      )
    `

    if (!tableExists[0].exists) {
      // Create the orders table from scratch
      await sql`
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          clerk_user_id TEXT,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_phone VARCHAR(20) NOT NULL,
          order_type VARCHAR(20) DEFAULT 'dine-in',
          payment_method VARCHAR(20) DEFAULT 'cod',
          payment_id VARCHAR(255),
          payment_status VARCHAR(20) DEFAULT 'pending',
          table_number INTEGER,
          delivery_address TEXT,
          subtotal DECIMAL(10,2) DEFAULT 0,
          delivery_fee DECIMAL(10,2) DEFAULT 0,
          discount_amount DECIMAL(10,2) DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL,
          coupon_code VARCHAR(50),
          currency VARCHAR(3) DEFAULT 'AED',
          special_instructions TEXT,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('Orders table created successfully')
    } else {
      // Add missing columns to existing table if needed
      const columnsToAdd = [
        { name: 'user_id', definition: 'TEXT', check: 'user_id' },
        { name: 'clerk_user_id', definition: 'TEXT', check: 'clerk_user_id' },
        { name: 'payment_method', definition: 'VARCHAR(20) DEFAULT \'cod\'', check: 'payment_method' },
        { name: 'payment_id', definition: 'VARCHAR(255)', check: 'payment_id' },
        { name: 'payment_status', definition: 'VARCHAR(20) DEFAULT \'pending\'', check: 'payment_status' },
        { name: 'subtotal', definition: 'DECIMAL(10,2) DEFAULT 0', check: 'subtotal' },
        { name: 'delivery_fee', definition: 'DECIMAL(10,2) DEFAULT 0', check: 'delivery_fee' },
        { name: 'discount_amount', definition: 'DECIMAL(10,2) DEFAULT 0', check: 'discount_amount' },
        { name: 'coupon_code', definition: 'VARCHAR(50)', check: 'coupon_code' },
        { name: 'currency', definition: 'VARCHAR(3) DEFAULT \'AED\'', check: 'currency' }
      ]

      for (const column of columnsToAdd) {
        try {
          const columnExists = await sql`
            SELECT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'orders' AND column_name = ${column.check}
            )
          `
          
          if (!columnExists[0].exists) {
            await sql.unsafe(`ALTER TABLE orders ADD COLUMN ${column.name} ${column.definition}`)
            console.log(`Added column: ${column.name}`)
          }
        } catch (colError) {
          console.log(`Column ${column.name} might already exist:`, colError)
        }
      }
      
      console.log('Orders table schema updated successfully')
    }
  } catch (error) {
    console.error('Error setting up orders table:', error)
    throw error // Re-throw to handle properly
  }
}

async function ensureOrderItemsTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER,
        menu_item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  } catch (error) {
    console.error('Error creating order_items table:', error)
    throw error
  }
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

    console.log('Processing order for user:', user)
    console.log('Order data received:', orderData)

    // Validate required fields
    if (!orderData.customerName || !orderData.customerPhone) {
      return NextResponse.json({ error: "Customer name and phone are required" }, { status: 400 })
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 })
    }

    // Ensure database tables exist with proper schema
    await ensureOrdersTableExists()
    await ensureOrderItemsTableExists()

    // Calculate totals
    const subtotal = orderData.originalAmount - (orderData.orderType === "delivery" ? 3.99 : 0) || 0
    const deliveryFee = orderData.orderType === "delivery" ? 3.99 : 0
    const discountAmount = orderData.discountAmount || 0
    const finalTotal = orderData.totalAmount || (subtotal + deliveryFee - discountAmount)

    // Determine payment status
    const paymentStatus = orderData.paymentMethod === 'upi' && orderData.paymentId ? 'paid' : 'pending'

    console.log('Inserting order with data:', {
      user_id: user?.isClerkUser ? null : user?.userId?.toString() || null,
      clerk_user_id: user?.isClerkUser ? user.userId : null,
      customer_name: orderData.customerName,
      payment_method: orderData.paymentMethod || "cod",
      payment_id: orderData.paymentId || null,
      payment_status: paymentStatus,
      currency: orderData.currency || 'AED',
      total_amount: finalTotal
    })

    // Insert order with proper user identification and payment details
    const [order] = await sql`
      INSERT INTO orders (
        user_id, clerk_user_id, customer_name, customer_email, customer_phone, 
        order_type, payment_method, payment_id, payment_status,
        table_number, delivery_address, 
        subtotal, delivery_fee, discount_amount, total_amount,
        coupon_code, currency, special_instructions, status
      ) VALUES (
        ${user?.isClerkUser ? null : user?.userId?.toString() || null},
        ${user?.isClerkUser ? user.userId : null},
        ${orderData.customerName}, 
        ${orderData.customerEmail || user?.email || null}, 
        ${orderData.customerPhone},
        ${orderData.orderType || "dine-in"},
        ${orderData.paymentMethod || "cod"},
        ${orderData.paymentId || null},
        ${paymentStatus},
        ${orderData.tableNumber || null}, 
        ${orderData.deliveryAddress || null},
        ${subtotal}, 
        ${deliveryFee}, 
        ${discountAmount},
        ${finalTotal},
        ${orderData.couponCode || null},
        ${orderData.currency || 'AED'},
        ${orderData.specialInstructions || null},
        'pending'
      ) RETURNING id
    `

    console.log('Order inserted with ID:', order.id)

    // Insert order items
    for (const item of orderData.items) {
      const totalPrice = parseFloat(item.unitPrice) * item.quantity

      await sql`
        INSERT INTO order_items (
          order_id, menu_item_id, menu_item_name, 
          quantity, unit_price, total_price, special_requests
        ) VALUES (
          ${order.id}, 
          ${item.menuItemId}, 
          ${item.menuItemName || "Unknown Item"},
          ${item.quantity}, 
          ${parseFloat(item.unitPrice)}, 
          ${totalPrice},
          ${item.specialRequests || null}
        )
      `
    }

    console.log('Order completed successfully')

    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount: finalTotal,
      paymentStatus,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ 
      error: "Failed to create order", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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

    // Ensure database tables exist with proper schema
    await ensureOrdersTableExists()
    await ensureOrderItemsTableExists()

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
          COALESCE(
            json_agg(
              CASE WHEN oi.id IS NOT NULL THEN
                json_build_object(
                  'id', oi.id,
                  'menu_item_id', oi.menu_item_id,
                  'menu_item_name', oi.menu_item_name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'total_price', oi.total_price,
                  'special_requests', oi.special_requests
                )
              END ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL), 
            '[]'::json
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
          COALESCE(
            json_agg(
              CASE WHEN oi.id IS NOT NULL THEN
                json_build_object(
                  'id', oi.id,
                  'menu_item_id', oi.menu_item_id,
                  'menu_item_name', oi.menu_item_name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'total_price', oi.total_price,
                  'special_requests', oi.special_requests
                )
              END ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL), 
            '[]'::json
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
    
    // Clean up the orders data to ensure proper structure
    const cleanOrders = orders.map(order => ({
      ...order,
      final_total: order.total_amount, // Ensure final_total is available for the frontend
      items: Array.isArray(order.items) ? order.items : []
    }))
    
    return NextResponse.json(cleanOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
