import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

// Comprehensive stock management for all status transitions
async function handleStockUpdate(orderId: number, previousStatus: string, newStatus: string, orderItems: any[]) {
  /*
  STOCK MANAGEMENT RULES:
  1. From pending to any other (except cancel) = REDUCE stock
  2. From any other to pending (except cancel) = RESTORE stock  
  3. From any other to cancel (except pending) = RESTORE stock
  4. From cancel to any other (except pending) = REDUCE stock
  5. No change for: pending↔cancel, same status, or other transitions
  */
  
  let stockAction = 'none' // 'reduce' | 'restore' | 'none'
  
  // Rule 1: From pending to any other (except cancel) = REDUCE stock
  if (previousStatus === 'pending' && newStatus !== 'cancel' && newStatus !== 'pending') {
    stockAction = 'reduce'
  }
  
  // Rule 2: From any other to pending (except cancel) = RESTORE stock
  else if (newStatus === 'pending' && previousStatus !== 'cancel' && previousStatus !== 'pending') {
    stockAction = 'restore'
  }
  
  // Rule 3: From any other to cancel (except pending) = RESTORE stock
  else if (newStatus === 'cancel' && previousStatus !== 'pending' && previousStatus !== 'cancel') {
    stockAction = 'restore'
  }
  
  // Rule 4: From cancel to any other (except pending) = REDUCE stock
  else if (previousStatus === 'cancel' && newStatus !== 'pending' && newStatus !== 'cancel') {
    stockAction = 'reduce'
  }
  
  if (stockAction === 'none') {
    console.log(`No stock update needed for transition: ${previousStatus} → ${newStatus}`)
    return
  }
  
  console.log(`Stock ${stockAction} for order ${orderId}: ${previousStatus} → ${newStatus}`)
  
  for (const item of orderItems) {
    const quantity = parseInt(item.quantity)
    // For reduce: negative change, For restore: positive change
    const changeAmount = quantity * (stockAction === 'reduce' ? -1 : 1)
    
    try {
      if (item.variant_id) {
        // Update variant stock
        await sql`
          UPDATE product_variants 
          SET stock_quantity = GREATEST(0, stock_quantity + ${changeAmount})
          WHERE id = ${item.variant_id}
        `
        console.log(`${stockAction === 'reduce' ? 'Reduced' : 'Restored'} variant ${item.variant_id} stock by ${Math.abs(changeAmount)}`)
      } else if (item.menu_item_id) {
        // Fallback: update product stock
        await sql`
          UPDATE products 
          SET stock_quantity = GREATEST(0, stock_quantity + ${changeAmount})
          WHERE id = ${item.menu_item_id}
        `
        console.log(`${stockAction === 'reduce' ? 'Reduced' : 'Restored'} product ${item.menu_item_id} stock by ${Math.abs(changeAmount)}`)
      }
    } catch (error) {
      console.error(`Error updating stock for item ${item.variant_id || item.menu_item_id}:`, error)
    }
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const validStatuses = ["pending", "confirmed", "packed", "dispatched", "out for delivery", "delivered", "cancel"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status. Valid statuses: " + validStatuses.join(', ') }, { status: 400 })
    }

    // Get current order details first
    const [currentOrder] = await sql`
      SELECT o.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'menu_item_id', oi.menu_item_id,
              'variant_id', oi.variant_id,
              'quantity', oi.quantity
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ${id}
      GROUP BY o.id
    `

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const previousStatus = currentOrder.status
    
    // Handle stock management based on status changes
    await handleStockUpdate(id, previousStatus, status, currentOrder.items)

    // Update order status
    const result = await sql`
      UPDATE orders 
      SET 
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING 
        id,
        customer_name,
        customer_email,
        customer_phone,
        COALESCE(order_type, 'delivery') as order_type,
        COALESCE(payment_method, 'cod') as payment_method,
        payment_status,
        payment_id,
        delivery_address,
        special_instructions,
        COALESCE(subtotal, 0) as total_amount,
        0 as tax_amount,
        COALESCE(delivery_fee, 0) as delivery_fee,
        total_amount as final_total,
        currency,
        discount_amount,
        coupon_code,
        status,
        created_at,
        updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    const order = result[0]
    console.log(`Order ${id} status updated from ${previousStatus} to ${status}`)

    // Return formatted response
    const formattedOrder = {
      id: parseInt(order.id),
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      order_type: order.order_type,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      payment_id: order.payment_id,
      delivery_address: order.delivery_address,
      special_instructions: order.special_instructions,
      total_amount: parseFloat(order.total_amount || '0'),
      tax_amount: parseFloat(order.tax_amount || '0'),
      delivery_fee: parseFloat(order.delivery_fee || '0'),
      final_total: parseFloat(order.final_total || '0'),
      currency: order.currency || 'INR',
      discount_amount: parseFloat(order.discount_amount || '0'),
      coupon_code: order.coupon_code,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at
    }

    return NextResponse.json(formattedOrder)


    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Failed to update order", details: error instanceof Error ? error.message : "Unknown error" }, 
      { status: 500 }
    )
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT
        o.id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        COALESCE(o.order_type, 'dine-in') as order_type,
        COALESCE(o.payment_method, 'cod') as payment_method,
        o.delivery_address,
        o.special_instructions as customer_address,
        COALESCE(o.subtotal, 0) as total_amount,
        0 as tax_amount,
        COALESCE(o.delivery_fee, 0) as delivery_fee,
        o.total_amount as final_total,
        o.status,
        o.special_instructions,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',            oi.id,
              'menu_item_id',  oi.menu_item_id,
              'menu_item_name',oi.menu_item_name,
              'quantity',      oi.quantity,
              'unit_price',    oi.unit_price,
              'total_price',   oi.total_price,
              'special_requests', oi.special_requests
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ${id}
      GROUP BY o.id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = result[0]
    const formattedOrder = {
      id: parseInt(order.id),
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      order_type: order.order_type,
      payment_method: order.payment_method,
      delivery_address: order.delivery_address,
      customer_address: order.customer_address,
      total_amount: parseFloat(order.total_amount || '0'),
      tax_amount: parseFloat(order.tax_amount || '0'),
      delivery_fee: parseFloat(order.delivery_fee || '0'),
      final_total: parseFloat(order.final_total || '0'),
      status: order.status,
      special_instructions: order.special_instructions,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: Array.isArray(order.items) ? order.items.map((item: any) => ({
        id: parseInt(item.id || '0'),
        menu_item_id: parseInt(item.menu_item_id || '0'),
        menu_item_name: item.menu_item_name,
        quantity: parseInt(item.quantity || '0'),
        unit_price: parseFloat(item.unit_price || '0'),
        total_price: parseFloat(item.total_price || '0'),
        special_requests: item.special_requests
      })) : []
    }

    return NextResponse.json(formattedOrder)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}
