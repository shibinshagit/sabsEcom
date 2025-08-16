
// app/api/admin/products/route.ts
import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { ensureShopCategoryColumn } from "@/lib/migrations/ensure-shop-category"

export async function GET() {
  try {
    // Ensure shop_category column exists
    await ensureShopCategoryColumn()
    
    const products = await sql`
      SELECT
        p.*,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC;
    `

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    // Ensure shop_category column exists
    await ensureShopCategoryColumn()
    
    const body = await request.json()
    const {
      name,
      description,
      price,
      image_url,
      category_id,
      shop_category,
      is_available,
      is_featured,
      is_new,
      new_until_date,
      features,
      specifications_text,
      warranty_months,
      brand,
      model,
      condition_type,
      warranty_period,
      storage_capacity,
      color,
      stock_quantity,
      sku,
    } = body

    // Validate required fields
    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      )
    }

    // Validate shop_category
    if (!shop_category || !['A', 'B'].includes(shop_category)) {
      return NextResponse.json(
        { error: "Shop category is required and must be 'A' or 'B'" },
        { status: 400 }
      )
    }

    // Generate SKU if not provided
    const finalSku = sku || `${shop_category}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

    const [product] = await sql`
      INSERT INTO products (
        name, description, price, image_url, category_id, shop_category,
        is_available, is_featured, is_new, new_until_date, features, specifications_text,
        warranty_months, brand, model, condition_type, warranty_period,
        storage_capacity, color, stock_quantity, sku
      ) VALUES (
        ${name}, ${description || ''}, ${price}, ${image_url || ''}, ${category_id}, ${shop_category},
        ${is_available ?? true}, ${is_featured ?? false}, ${is_new ?? false}, 
        ${new_until_date || null}, ${features || []}, ${specifications_text || ''},
        ${warranty_months || 12}, ${brand || ''}, ${model || ''}, ${condition_type || 'new'}, 
        ${warranty_period || 12}, ${storage_capacity || ''}, ${color || ''}, 
        ${stock_quantity || 1}, ${finalSku}
      )
      RETURNING *;
    `

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    
    // Handle duplicate SKU error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "Product with this SKU already exists. Please use a different SKU." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to create product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}