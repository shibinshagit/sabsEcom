import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { ensureShopCategoryColumn } from "@/lib/migrations/ensure-shop-category"
import { ensureCurrencySupport } from "@/lib/migrations/ensure-currency-support"

export async function GET() {
  try {
    // Ensure shop_category column exists
    await ensureShopCategoryColumn()
    // Ensure currency support exists
    await ensureCurrencySupport()
    
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
    // Ensure currency support exists
    await ensureCurrencySupport()
    
    const body = await request.json()
    const {
      name,
      description,
      price, // Keep for backward compatibility
      price_aed,
      price_inr,
      default_currency,
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
    if (!name || !category_id) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      )
    }

    // Validate at least one price is provided
    if (!price_aed && !price_inr && !price) {
      return NextResponse.json(
        { error: "At least one price (AED or INR) is required" },
        { status: 400 }
      )
    }

    // Validate default currency
    if (default_currency && !['AED', 'INR'].includes(default_currency)) {
      return NextResponse.json(
        { error: "Default currency must be either 'AED' or 'INR'" },
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

    // Determine default currency if not provided
    let finalDefaultCurrency = default_currency || 'AED'
    if (!default_currency) {
      if (price_aed && !price_inr) finalDefaultCurrency = 'AED'
      else if (price_inr && !price_aed) finalDefaultCurrency = 'INR'
    }

    // Handle backward compatibility for price field
    const finalPriceAed = price_aed || (finalDefaultCurrency === 'AED' ? price : null)
    const finalPriceInr = price_inr || (finalDefaultCurrency === 'INR' ? price : null)
    const finalPrice = price || (finalDefaultCurrency === 'AED' ? price_aed : price_inr)

    const [product] = await sql`
      INSERT INTO products (
        name, description, price, price_aed, price_inr, default_currency, image_url, category_id, shop_category,
        is_available, is_featured, is_new, new_until_date, features, specifications_text,
        warranty_months, brand, model, condition_type, warranty_period,
        storage_capacity, color, stock_quantity, sku
      ) VALUES (
        ${name}, ${description || ''}, ${finalPrice}, ${finalPriceAed}, ${finalPriceInr}, ${finalDefaultCurrency}, 
        ${image_url || ''}, ${category_id}, ${shop_category},
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
