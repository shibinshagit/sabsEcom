import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
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
    const body = await request.json()
    const {
      name,
      description,
      price,
      image_url,
      category_id,
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

    const [product] = await sql`
      INSERT INTO products (
        name, description, price, image_url, category_id,
        is_available, is_featured, is_new, new_until_date, features, specifications_text,
        warranty_months, brand, model, condition_type, warranty_period,
        storage_capacity, color, stock_quantity, sku
      ) VALUES (
        ${name}, ${description}, ${price}, ${image_url}, ${category_id},
        ${is_available}, ${is_featured}, ${is_new}, ${new_until_date}, ${features}, ${specifications_text},
        ${warranty_months}, ${brand}, ${model}, ${condition_type}, ${warranty_period},
        ${storage_capacity}, ${color}, ${stock_quantity}, ${sku}
      )
      ON CONFLICT (sku) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        image_url = EXCLUDED.image_url,
        category_id = EXCLUDED.category_id,
        is_available = EXCLUDED.is_available,
        is_featured = EXCLUDED.is_featured,
        is_new = EXCLUDED.is_new,
        new_until_date = EXCLUDED.new_until_date,
        features = EXCLUDED.features,
        specifications_text = EXCLUDED.specifications_text,
        warranty_months = EXCLUDED.warranty_months,
        brand = EXCLUDED.brand,
        model = EXCLUDED.model,
        condition_type = EXCLUDED.condition_type,
        warranty_period = EXCLUDED.warranty_period,
        storage_capacity = EXCLUDED.storage_capacity,
        color = EXCLUDED.color,
        stock_quantity = EXCLUDED.stock_quantity,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
} 