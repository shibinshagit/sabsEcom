import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status, estimatedCompletionTime } = await request.json()
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const result = await sql`
      UPDATE orders 
      SET 
        status = ${status},
        estimated_completion_time = ${estimatedCompletionTime || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING 
        id,
        customer_name,
        customer_email,
        customer_phone,
        COALESCE(order_type, payment_method, 'COD') as order_type,
        COALESCE(subtotal, 0) as total_amount,
        0 as tax_amount,
        COALESCE(delivery_fee, 0) as delivery_fee,
        total_amount as final_total,
        status,
        special_instructions,
        created_at,
        updated_at
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
      order_type: (order.order_type || 'COD').toUpperCase(),
      total_amount: parseFloat(order.total_amount || '0'),
      tax_amount: parseFloat(order.tax_amount || '0'),
      delivery_fee: parseFloat(order.delivery_fee || '0'),
      final_total: parseFloat(order.final_total || '0'),
      status: order.status,
      special_instructions: order.special_instructions,
      created_at: order.created_at,
      updated_at: order.updated_at
    }

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
        COALESCE(o.order_type, o.payment_method, 'COD') as order_type,
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
      order_type: (order.order_type || 'COD').toUpperCase(),
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
